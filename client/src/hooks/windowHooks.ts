export function useIsThumbnailVisible() {
  return function (galleryContainerEl: HTMLElement, thumbnailEl: HTMLElement) {
    if (!galleryContainerEl || !thumbnailEl) {
      return false;
    }

    const thumbnailRect = thumbnailEl.getBoundingClientRect();
    console.log(
      "thumbnailRect",
      // galleryContainerEl.get,
      thumbnailEl.scrollHeight,
      thumbnailRect.top,
      // thumbnailRect.bottom,
      galleryContainerEl.clientHeight,
      thumbnailEl
    );
    if (
      thumbnailRect.top < galleryContainerEl.clientHeight &&
      thumbnailRect.bottom > 0
    ) {
      return true;
    }

    return false;
  };
}
