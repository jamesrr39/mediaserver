// tslint:disable-next-line:no-any
export function deepEqual(obj1: Readonly<any>, obj2: Readonly<any>): boolean {
  // TODO: better check
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}
