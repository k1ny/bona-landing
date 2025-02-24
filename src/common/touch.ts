import { Pointer, PointerEventType } from "./pointer";

type TouchEventType = "touchstart" | "touchend" | "touchmove";

const EVENT_TYPES_MAP = {
  start: "touchstart",
  move: "touchmove",
  end: "touchend",
} satisfies Record<PointerEventType, TouchEventType>;

export class Touch extends Pointer {
  constructor() {
    super();

    document.addEventListener("touchstart", (event) => {
      this._x = event.touches[0].clientX;
      this._y = event.touches[0].clientY;
    });

    document.addEventListener("touchmove", (event) => {
      this._x = event.touches[0].clientX;
      this._y = event.touches[0].clientY;
    });
  }

  addEventListener(
    element: HTMLElement,
    type: PointerEventType,
    fn: (event: TouchEvent) => void,
  ): void {
    element.addEventListener(EVENT_TYPES_MAP[type], fn);
  }
}
