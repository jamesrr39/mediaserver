import * as React from "react";
import { createCompareTimeTakenFunc } from "../../domain/PictureMetadata";

import { MediaFile } from "../../domain/MediaFile";
import FilterComponent from "./FilterComponent";
import GalleryFilter from "../../domain/filter/GalleryFilter";
import { getScreenHeight } from "../../util/screen_size";
import GalleryWrapper from "./GalleryWrapper";
import { PeopleMap } from "../../actions/mediaFileActions";
import { Observable, DebouncedObservable } from "ts-util/src/Observable";
import { DateFilter } from "src/domain/filter/DateFilter";
import { ScrollResizeContext } from "src/context/WindowContext";

const styles = {
  title: {
    margin: "10px",
  },
};

export type GalleryProps = {
  mediaFiles: MediaFile[];
  peopleMap: PeopleMap;
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
  const onFilterChangeObservable = React.useMemo(
    () => new DebouncedObservable<GalleryFilter>(50),
    []
  );

  const galleryContainerEl = React.useRef();

  const {
    title,
    mediaFiles,
    mediaFileUrlBase,
    onClickThumbnail,
    showMap,
    peopleMap,
  } = props;
  const [elementPosTopOffset, setElementPosTopOffset] = React.useState(0);

  const scrollResizeObservable = React.useContext(ScrollResizeContext);

  const setGalleryHeight = (
    el: HTMLElement | null,
    scrollResizeObservable: Observable<void>
  ) => {
    console.log("setGH", el);
    if (!el) {
      return;
    }

    el.addEventListener("scroll", () => scrollResizeObservable.triggerEvent());
    el.addEventListener("resize", () => {
      console.log("GWF trigger");
      scrollResizeObservable.triggerEvent();
    });

    const newElementPosTopOffset = el.getBoundingClientRect().top;

    if (elementPosTopOffset === newElementPosTopOffset) {
      return;
    }

    setElementPosTopOffset(newElementPosTopOffset);
  };

  setGalleryHeight(galleryContainerEl.current, scrollResizeObservable);

  const dateRange = getDateRange(mediaFiles);

  const filterComponentProps = {
    initialFilter: new GalleryFilter(
      new DateFilter({ includeFilesWithoutDates: true })
    ),
    initialStartDateValue: dateRange.start,
    initialEndDateValue: dateRange.end,
    onFilterChange: (filter: GalleryFilter) =>
      onFilterChangeObservable.triggerEvent(filter),
  };

  const isThumbnailVisible = (thumbnailEl: HTMLElement) => {
    console.log("isTV");
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

  return (
    <>
      <FilterComponent {...filterComponentProps} />
      {title && <h1 style={styles.title}>{title}</h1>}
      <div style={wrapperStyles} ref={galleryContainerEl}>
        <GalleryWrapper
          onFilterChangeObservable={onFilterChangeObservable}
          mediaFiles={mediaFiles}
          mediaFileUrlBase={mediaFileUrlBase}
          onClickThumbnail={onClickThumbnail}
          showMap={showMap}
          peopleMap={peopleMap}
          isThumbnailVisible={isThumbnailVisible}
        />
      </div>
    </>
  );
}

export default GalleryWithFilter;
