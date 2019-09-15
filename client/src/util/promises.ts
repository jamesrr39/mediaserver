export type CancellablePromise<T> = {
  promise: Promise<T>
  cancel(): void;
};

export const makeCancelable = <T>(promise: Promise<T>) => {
  let hasCanceled = false;

  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise.then(
      val => hasCanceled ? reject({isCanceled: true}) : resolve(val),
      error => hasCanceled ? reject({isCanceled: true}) : reject(error)
    );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled = true;
    },
  };
};
