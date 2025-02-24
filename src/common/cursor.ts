import { Pointer, PointerEventType } from "./pointer";

type MouseEventType = "mousedown" | "mousemove" | "mouseup";

const EVENT_TYPES_MAP = {
  start: "mousedown",
  move: "mousemove",
  end: "mouseup",
} satisfies Record<PointerEventType, MouseEventType>;

export class Cursor extends Pointer {
  constructor() {
    super();
    document.addEventListener("mousemove", (event) => {
      this._x = event.pageX;
      this._y = event.pageY;
    });
  }

  addEventListener(
    element: HTMLElement,
    type: PointerEventType,
    fn: (event: MouseEvent) => void,
  ): void {
    element.addEventListener(EVENT_TYPES_MAP[type], fn);
  }
}
