export const SMALL_SCREEN_WIDTH = 500;

export function isNarrowScreen() {
  return window.innerWidth <= SMALL_SCREEN_WIDTH;
}

export function getScreenWidth() {
  return window.innerWidth;
}
