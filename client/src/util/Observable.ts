export type Callback = () => void;

export interface Observable {
  addListener(cb: Callback): void;
  removeListener(cb: Callback): void;
  triggerEvent(): void;
}

export class DebouncedObservable {
  private callbacks: Callback[] = [];
  private debounceTimeMs: number;
  private emptyObject = {};

  constructor(debounceTimeMs: number) {
    this.debounceTimeMs = debounceTimeMs;
  }

  addListener(cb: Callback) {
    this.callbacks.push(cb);
  }

  removeListener(cb: Callback) {
    const i = this.callbacks.indexOf(cb);

    this.callbacks.splice(i, 1);
  }

  triggerEvent() {
    const emptyObject = {};
    this.emptyObject = emptyObject;
    const timeoutCallback = () => {
      if (this.emptyObject !== emptyObject) {
        // there has been another event since our event was added.
        return;
      }
      this.callbacks.forEach(listener => {
        listener();
      });
    };
    setTimeout(timeoutCallback, this.debounceTimeMs);
  }
}
