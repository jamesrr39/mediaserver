import * as React from "react";
import { createCompareTimeTakenFunc } from "../../domain/PictureMetadata";

import {
  BuildLinkContext,
  BuildLinkFunc,
  createBuildLinkFunc,
} from "src/context/BuildLinkContext";
import { ScrollResizeContext } from "src/context/WindowContext";
import { DateFilter } from "src/domain/filter/DateFilter";
import { Observable } from "ts-util/src/Observable";
import GalleryFilter from "../../domain/filter/GalleryFilter";
import { MediaFile } from "../../domain/MediaFile";
import { getScreenHeight } from "../../util/screen_size";
import FilterComponent from "./FilterComponent";
import Gallery from "./Gallery";

const styles = {
  title: {
    margin: "10px",
  },
};

export type GalleryProps = {
  mediaFiles: MediaFile[];
  mediaFileUrlBase?: string; // example: `/gallery/detail`. If undefined, no link should be added.
  onClickThumbnail?: (pictureMetadata: MediaFile) => void;
  showMap?: boolean;
  title?: string;
};

export const gallerySortingFunc = createCompareTimeTakenFunc(true);

type DateRange = {
  start?: Date;
  end?: Date;
};

function getDateRange(mediaFiles: MediaFile[]): DateRange {
  let start: Date | undefined = undefined;
  let end: Date | undefined = undefined;

  mediaFiles.forEach((mediaFile) => {
    const timeTaken = mediaFile.getTimeTaken();
    if (timeTaken === null) {
      return;
    }

    if (!start || timeTaken < start) {
      start = timeTaken;
    }

    if (!end || timeTaken > end) {
      end = timeTaken;
    }
  });

  return { start, end };
}

function GalleryWithFilter(props: GalleryProps) {
  const [filter, setFilter] = React.useState(
    new GalleryFilter(new DateFilter({ includeFilesWithoutDates: true }))
  );

  const galleryContainerEl = React.useRef();

  const { title, mediaFiles, mediaFileUrlBase, onClickThumbnail, showMap } =
    props;
  const [elementPosTopOffset, setElementPosTopOffset] = React.useState(0);

  const scrollResizeObservable = React.useContext(ScrollResizeContext);

  const setGalleryHeight = (
    el: HTMLElement | null,
    scrollResizeObservable: Observable<void>
  ) => {
    if (!el) {
      return;
    }

    el.addEventListener("scroll", () => scrollResizeObservable.triggerEvent());
    el.addEventListener("resize", () => scrollResizeObservable.triggerEvent());

    const newElementPosTopOffset = el.getBoundingClientRect().top;

    if (elementPosTopOffset === newElementPosTopOffset) {
      return;
    }

    setElementPosTopOffset(newElementPosTopOffset);
  };

  setGalleryHeight(galleryContainerEl.current, scrollResizeObservable);

  const dateRange = getDateRange(mediaFiles);

  // const filterComponentProps = {
  //   initialFilter: new GalleryFilter(
  //     new DateFilter({ includeFilesWithoutDates: true })
  //   ),
  //   initialStartDateValue: dateRange.start,
  //   initialEndDateValue: dateRange.end,
  //   onFilterChange: (filter: GalleryFilter) =>
  //     onFilterChangeObservable.triggerEvent(filter),
  // };

  const isThumbnailVisible = (thumbnailEl: HTMLElement) => {
    if (!galleryContainerEl.current) {
      return false;
    }

    const thumbnailRect = thumbnailEl.getBoundingClientRect();

    if (thumbnailRect.top < window.innerHeight && thumbnailRect.bottom > 0) {
      return true;
    }

    return false;
  };

  const wrapperStyles = {
    height: getScreenHeight() - elementPosTopOffset,
    overflowY: "scroll" as "scroll",
  };

  let buildLinkFunc: BuildLinkFunc | undefined;
  if (mediaFileUrlBase) {
    buildLinkFunc = createBuildLinkFunc(filter, mediaFileUrlBase);
  }

  return (
    <>
      <FilterComponent initialFilter={filter} onFilterChange={setFilter} />
      {title && <h1 style={styles.title}>{title}</h1>}
      <div style={wrapperStyles} ref={galleryContainerEl}>
        <BuildLinkContext.Provider value={buildLinkFunc}>
          <Gallery
            mediaFiles={mediaFiles.filter((mediaFile) =>
              filter.filter(mediaFile)
            )}
            mediaFileUrlBase={mediaFileUrlBase}
            onClickThumbnail={onClickThumbnail}
            showMap={showMap}
            isThumbnailVisible={isThumbnailVisible}
          />
        </BuildLinkContext.Provider>
      </div>
    </>
  );
}

export default GalleryWithFilter;
