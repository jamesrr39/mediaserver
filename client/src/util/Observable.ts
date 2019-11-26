export type Callback<T> = (arg: T) => void;

export interface Observable<T> {
  addListener(cb: Callback<T>): void;
  removeListener(cb: Callback<T>): void;
  triggerEvent(thing: T): void;
}

export class DebouncedObservable<T> {
  private callbacks: Callback<T>[] = [];
  private debounceTimeMs: number;
  private emptyObject = {};

  constructor(debounceTimeMs: number) {
    this.debounceTimeMs = debounceTimeMs;
  }

  addListener(cb: Callback<T>) {
    this.callbacks.push(cb);
  }

  removeListener(cb: Callback<T>) {
    const i = this.callbacks.indexOf(cb);

    if (i === -1) {
      throw new Error('callback being removed is not in list of callbacks');
    }

    this.callbacks.splice(i, 1);
  }

  triggerEvent(thing: T) {
    const emptyObject = {};
    this.emptyObject = emptyObject;
    const timeoutCallback = () => {
      if (this.emptyObject !== emptyObject) {
        // there has been another event since our event was added.
        return;
      }
      this.callbacks.forEach(listener => {
        listener(thing);
      });
    };
    setTimeout(timeoutCallback, this.debounceTimeMs);
  }
}
