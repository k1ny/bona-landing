export type PointerEventType = "start" | "move" | "end";

export abstract class Pointer {
  protected _x: number;
  protected _y: number;

  constructor() {
    this._x = undefined!;
    this._y = undefined!;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  abstract addEventListener(
    element: HTMLElement | Document | Window,
    type: PointerEventType,
    fn: (event: MouseEvent | TouchEvent) => void,
  ): void;
}
