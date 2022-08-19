import * as React from "react";
import { createCompareTimeTakenFunc } from "../../domain/PictureMetadata";

import { DebouncedObservable } from "ts-util/dist/Observable";
import { MediaFile } from "../../domain/MediaFile";
import FilterComponent from "./FilterComponent";
import { GalleryFilter } from "../../domain/filter/GalleryFilter";
import { getScreenHeight } from "../../util/screen_size";
import InnerGalleryWrapper from "./GalleryWrapper";
import { PeopleMap } from "../../actions/mediaFileActions";
import { connect } from "react-redux";
import { State } from "src/reducers/rootReducer";
import { Observable } from "ts-util/src/Observable";
import { DateFilter } from "src/domain/filter/DateFilter";

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
  scrollObservable: Observable<void>;
  resizeObservable: Observable<void>;
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

class GalleryWithFilter extends React.Component<GalleryProps> {
  state = {
    elementPosTopOffset: 0,
  };

  private onFilterChangeObservable = new DebouncedObservable<GalleryFilter>(50);

  private galleryContainerEl: HTMLElement | null = null;

  render() {
    const { title } = this.props;

    const dateRange = getDateRange(this.props.mediaFiles);

    const filterComponentProps = {
      initialFilter: new GalleryFilter(
        new DateFilter({ includeFilesWithoutDates: true })
      ),
      initialStartDateValue: dateRange.start,
      initialEndDateValue: dateRange.end,
      onFilterChange: (filter: GalleryFilter) => {
        this.onFilterChangeObservable.triggerEvent(filter);
      },
    };

    const isThumbnailVisible = (thumbnailEl: HTMLElement) => {
      if (!this.galleryContainerEl) {
        return false;
      }

      const thumbnailRect = thumbnailEl.getBoundingClientRect();

      if (thumbnailRect.top < window.innerHeight && thumbnailRect.bottom > 0) {
        return true;
      }

      return false;
    };

    const innerGalleryProps = {
      ...this.props,
      onFilterChangeObservable: this.onFilterChangeObservable,
      isThumbnailVisible,
    };

    const wrapperStyles = {
      height: getScreenHeight() - this.state.elementPosTopOffset,
      overflowY: "scroll" as "scroll",
    };

    return (
      <>
        <FilterComponent {...filterComponentProps} />
        {title && <h1 style={styles.title}>{title}</h1>}
        <div
          style={wrapperStyles}
          ref={(el) => {
            this.setGalleryHeight(el);
            this.galleryContainerEl = el;
          }}
        >
          <InnerGalleryWrapper {...innerGalleryProps} />
        </div>
      </>
    );
  }

  private setGalleryHeight(el: HTMLElement | null) {
    if (!el) {
      return;
    }

    el.addEventListener("scroll", () =>
      this.props.scrollObservable.triggerEvent()
    );
    el.addEventListener("resize", () =>
      this.props.resizeObservable.triggerEvent()
    );

    const elementPosTopOffset = el.getBoundingClientRect().top;

    if (elementPosTopOffset === this.state.elementPosTopOffset) {
      return;
    }

    this.setState((state) => ({ ...state, elementPosTopOffset }));
  }
}

export default connect((state: State) => {
  const { resizeObservable, scrollObservable } = state.windowReducer;

  return { resizeObservable, scrollObservable };
})(GalleryWithFilter);
