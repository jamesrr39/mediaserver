export function useIsThumbnailVisible(
  galleryContainerEl: HTMLElement,
  thumbnailEl: HTMLElement
) {
  if (!galleryContainerEl) {
    return false;
  }

  const thumbnailRect = thumbnailEl.getBoundingClientRect();

  if (thumbnailRect.top < window.innerHeight && thumbnailRect.bottom > 0) {
    return true;
  }

  return false;
}
