import { throttle } from "./utils";

export type Breakpoint = "SM" | "MD" | "LG";

export const breakpoints: Readonly<Record<Breakpoint, number>> = {
  SM: 0,
  MD: 767,
  LG: 1279,
};

function calculateBreakpoint(sizeX: number) {
  return Object.entries(breakpoints).reduce<Breakpoint>(
    (acc, [breakpoint, minWidth]) => {
      return sizeX >= minWidth ? (breakpoint as Breakpoint) : acc;
    },
    "SM",
  );
}

export class Screen {
  private _currentBreakpoint: Breakpoint;
  private subscribers: ((updatedBreakpoint: Breakpoint) => void)[];

  constructor() {
    this._currentBreakpoint = calculateBreakpoint(
      window.visualViewport?.width!,
    );
    this.subscribers = [];
    this.init();
  }

  init() {
    window.addEventListener(
      "resize",
      throttle(() => {
        const breakpoint = calculateBreakpoint(window.visualViewport?.width!);
        if (breakpoint !== this._currentBreakpoint) {
          this._currentBreakpoint = breakpoint;
          this.subscribers.forEach((subscriber) =>
            subscriber(this._currentBreakpoint),
          );
        }
      }, 200),
    );
  }

  subscribe(fn: (updatedBreakpoint: Breakpoint) => void) {
    this.subscribers.push(fn);
    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter(
          (subscriber) => subscriber !== fn,
        );
      },
    };
  }

  get currentBreakpoint() {
    return this._currentBreakpoint;
  }
}
