import { Pointer } from "./pointer";
import { Breakpoint, Screen } from "./screen";

export class ElementMissingError extends Error {
  readonly root: HTMLElement;

  constructor(selector: string, root: HTMLElement) {
    super(`Missing element with selector "${selector}"`);
    this.root = root;
  }
}

export class AttributeMissingError extends Error {
  readonly root: HTMLElement;

  constructor(name: string, root: HTMLElement) {
    super(`Missing attibute with name "${name}"`);
    this.root = root;
  }
}

const SWIPE_TIME_MS = 300;
const CONTAINER_SELECTOR = ".swiper__container";
const TRANSITION_STYLE = "translate 0.45s";

class SwiperIndicator {
  private indicatorRoot: HTMLElement;

  constructor(private readonly swiper: Swiper) {
    this.indicatorRoot = document.createElement("div");
    this.indicatorRoot.classList.add("swiper__indicator-container");
    swiper.rootElement.append(this.indicatorRoot);
  }

  mount() {
    if (this.swiper.numberOfPages === 1) {
      return;
    }

    for (let i = 0; i < this.swiper.numberOfPages; i++) {
      const indicatorItem = document.createElement("span");
      indicatorItem.classList.add("swiper__indicator");

      if (i === this.swiper.currentSlideIndex) {
        indicatorItem.dataset.active = "";
      }

      this.indicatorRoot.append(indicatorItem);

      indicatorItem.addEventListener("click", () => this.swiper.setIndex(i));
    }
  }

  unmount() {
    this.indicatorRoot.innerHTML = "";
  }

  update() {
    if (this.swiper.numberOfPages === 1) {
      return;
    }

    const children = this.indicatorRoot
      .children as HTMLCollectionOf<HTMLElement>;

    for (const child of children) {
      delete child.dataset.active;
    }

    children[this.swiper.currentSlideIndex].dataset.active = "";
  }
}

export class Swiper {
  // TODO: Add param
  left() {
    this._currentSlideIndex--;
    this.clampPageWithinBounds();
    this.applyCurrentTranslatePosition();
    this.indicator.update();
  }

  right() {
    this._currentSlideIndex++;
    this.clampPageWithinBounds();
    this.applyCurrentTranslatePosition();
    this.indicator.update();
  }

  setIndex(index: number) {
    this._currentSlideIndex = index;
    this.clampPageWithinBounds();
    this.applyCurrentTranslatePosition();
    this.indicator.update();
  }

  get currentSlideIndex() {
    return this._currentSlideIndex;
  }

  get numberOfPages() {
    return (
      this.slides.length -
      Math.min(this.visibleSlidesCount, this.slides.length) +
      1
    );
  }

  private readonly container: HTMLElement;
  private readonly slides: HTMLElement[];
  private indicator: SwiperIndicator;

  private dragState: {
    getDragMetrics: () => { dragTime: number; cursorShift: number };
    finalizeDrag: () => void;
  } | null = null;

  private readonly breakpointSlidesMap: Readonly<Record<Breakpoint, number>>;
  private _currentSlideIndex = 0;

  constructor(
    readonly rootElement: HTMLElement,
    private readonly pointer: Pointer,
    private readonly screen: Screen,
    private readonly options: { gap: string },
  ) {
    const container =
      rootElement.querySelector<HTMLElement>(CONTAINER_SELECTOR);

    if (!container) {
      throw new ElementMissingError(CONTAINER_SELECTOR, rootElement);
    }

    const slidesPerView = Object.fromEntries(
      (["SM", "MD", "LG"] satisfies Breakpoint[]).map((breakpoint) => {
        const attributeName = `data-slides-per-view-${breakpoint.toLowerCase()}`;
        const attribute = rootElement.attributes.getNamedItem(attributeName);

        if (!attribute) {
          throw new AttributeMissingError(attributeName, rootElement);
        }

        return [breakpoint, Number.parseInt(attribute.value, 10)];
      }),
    ) as Record<Breakpoint, number>;

    this.container = container;
    this.breakpointSlidesMap = slidesPerView;
    this.slides = [
      ...(this.container.children as HTMLCollectionOf<HTMLElement>),
    ];

    this.initializeContainerStyles();
    this.updateSlidesWidth();
    this.initializeEventListeners();

    screen.subscribe(this.onChangeBreakpoint.bind(this));

    this.indicator = new SwiperIndicator(this);
    this.indicator.mount();
  }

  private startDragSession() {
    let released = false;
    let initialMetrics: { pointer: number; startTime: number };

    const finalizeDrag = () => {
      released = true;
      this.container.style.removeProperty("translate");
      this.container.style.transition = TRANSITION_STYLE;
    };

    const getDragMetrics = () => ({
      cursorShift: this.pointer.x - initialMetrics.pointer,
      dragTime: Date.now() - initialMetrics.startTime,
    });

    this.dragState = { finalizeDrag, getDragMetrics };

    this.container.style.removeProperty("transition");

    const animateDrag = () => {
      if (!initialMetrics) {
        initialMetrics = { pointer: this.pointer.x, startTime: Date.now() };
      }

      if (released) {
        return;
      }

      const difX = this.pointer.x - initialMetrics.pointer;

      const limitedDifX =
        (this._currentSlideIndex === 0 && difX >= 0) ||
        (this._currentSlideIndex === this.numberOfPages - 1 && difX < 0)
          ? Math.sign(difX) * Math.sqrt(Math.abs(difX))
          : difX;

      this.container.style.translate =
        this.calculateTranslateValueCSS(limitedDifX);

      requestAnimationFrame(animateDrag);
    };

    requestAnimationFrame(animateDrag);
  }

  private endDragSession() {
    if (!this.dragState) {
      return;
    }

    this.dragState.finalizeDrag();
    const { cursorShift, dragTime } = this.dragState.getDragMetrics();

    if (dragTime < SWIPE_TIME_MS) {
      this._currentSlideIndex += -Math.sign(cursorShift);
    } else {
      const approximateSlideWidth =
        this.container.clientWidth / this.visibleSlidesCount;
      const shiftedSlidesCount = Math.round(
        Math.abs(cursorShift) / approximateSlideWidth,
      );
      this._currentSlideIndex += -Math.sign(cursorShift) * shiftedSlidesCount;
    }

    this.clampPageWithinBounds();
    this.applyCurrentTranslatePosition();
    this.indicator.update();
    this.dragState = null;
  }

  private initializeEventListeners() {
    this.pointer.addEventListener(this.rootElement, "start", (event) =>
      "button" in event
        ? event.button === 0 && this.startDragSession()
        : this.startDragSession(),
    );

    this.pointer.addEventListener(
      document.documentElement,
      "end",
      this.endDragSession.bind(this),
    );

    document.addEventListener("dragstart", this.endDragSession.bind(this));
  }

  private applyCurrentTranslatePosition() {
    this.container.style.translate = this.calculateTranslateValueCSS();
  }

  private updateSlidesWidth() {
    const slideWidth = this.calculateSlideWidthCSS();

    this.slides.forEach((slide) => {
      slide.style.minWidth = slideWidth;
    });
  }

  private initializeContainerStyles() {
    this.container.style.transition = TRANSITION_STYLE;
    this.container.style.gap = this.options.gap;
  }

  private calculateTranslateValueCSS(additionalShift = 0) {
    return `calc(${(this._currentSlideIndex * -100) / this.visibleSlidesCount}% - ${this.options.gap} / ${this.visibleSlidesCount} * ${this._currentSlideIndex} + ${additionalShift}px)`;
  }

  private calculateSlideWidthCSS() {
    return `calc(100% / ${this.visibleSlidesCount} - ${this.options.gap} / ${this.visibleSlidesCount} * ${this.visibleSlidesCount - 1})`;
  }

  private get visibleSlidesCount() {
    return this.breakpointSlidesMap[this.screen.currentBreakpoint];
  }

  private onChangeBreakpoint() {
    this.clampPageWithinBounds();
    this.updateSlidesWidth();
    this.applyCurrentTranslatePosition();
    this.indicator.unmount();
    this.indicator.mount();
  }

  private clampPageWithinBounds() {
    this._currentSlideIndex = Math.min(
      Math.max(this._currentSlideIndex, 0),
      this.numberOfPages - 1,
    );
  }
}
