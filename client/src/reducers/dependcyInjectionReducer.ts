import { DebouncedObservable, Observable } from '../util/Observable';

const scrollObservable = new DebouncedObservable<void>(150);
const resizeObservable = new DebouncedObservable<void>(150);

window.addEventListener('scroll', () => scrollObservable.triggerEvent());
window.addEventListener('resize', () => resizeObservable.triggerEvent());

export type DIState = {
  scrollObservable: Observable<void>,
  resizeObservable: Observable<void>,
};

export function dependencyInjectionReducer(state: DIState = {scrollObservable, resizeObservable}) {
    return state;
}
