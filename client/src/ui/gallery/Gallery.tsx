import * as React from 'react';
import { createCompareTimeTakenFunc } from '../../domain/PictureMetadata';

import { DebouncedObservable } from '../../util/Observable';
import { connect } from 'react-redux';
import { MediaFile } from '../../domain/MediaFile';
import { FitTrack, Record } from '../../domain/FitTrack';
import { fetchRecordsForTracks } from '../../actions/mediaFileActions';
import { FilterComponent } from './FilterComponent';
import { GalleryFilter } from '../../domain/Filter';
import { InnerGalleryWrapper } from './InnerGalleryWrapper';
import { getScreenHeight } from '../../util/screen_size';

export type GalleryProps = {
  mediaFiles: MediaFile[];
  mediaFileUrlBase?: string; // example: `/gallery/detail`. If undefined, no link should be added.
  onClickThumbnail?: (pictureMetadata: MediaFile) => void;
  showMap?: boolean;
  fetchRecordsForTracks: (trackSummary: FitTrack[]) => Promise<Map<string, Record[]>>;
  getRowWidth(): number;
};

export const gallerySortingFunc = createCompareTimeTakenFunc(true);

type DateRange = {
  start?: Date,
  end?: Date,
};

function getDateRange(mediaFiles: MediaFile[]): DateRange {
  let start: Date|undefined = undefined;
  let end: Date|undefined = undefined;

  mediaFiles.forEach(mediaFile => {
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

type GalleryState = {
  elementPosTopOffset: number;
};

class GalleryWithFilter extends React.Component<GalleryProps, GalleryState> {
  state = {
    elementPosTopOffset: 0,
  };

  private onFilterChangeObservable = new DebouncedObservable<GalleryFilter>(50);

  private scrollObservable = new DebouncedObservable<{}>(150);
  private resizeObservable = new DebouncedObservable<{}>(150);

  private galleryContainerEl: HTMLElement|null = null;

  render() {
    const {scrollObservable, resizeObservable} = this;

    const dateRange = getDateRange(this.props.mediaFiles);

    const filterComponentProps = {
      initialFilter: new GalleryFilter(null),
      initialStartDateValue: dateRange.start,
      initialEndDateValue: dateRange.end,
      onFilterChange: (filter: GalleryFilter) => {
        this.onFilterChangeObservable.triggerEvent(filter);
      },
    };

    const innerGalleryProps = {
      ...this.props,
      scrollObservable,
      resizeObservable,
      onFilterChangeObservable: this.onFilterChangeObservable,
      isThumbnailVisible: (thumbnailEl: HTMLElement) => {
        if (!this.galleryContainerEl) {
          return false;
        }

        const thumbnailRect = thumbnailEl.getBoundingClientRect();

        if (thumbnailRect.top < window.innerHeight && thumbnailRect.bottom > 0) {
          return true;
        }

        return false;
      }
    };

    const wrapperStyles = {
      height: getScreenHeight() - this.state.elementPosTopOffset,
      overflowY: 'scroll' as 'scroll',
    };

    return (
      <>
        <FilterComponent {...filterComponentProps} />
        <div style={wrapperStyles} ref={el => {this.setGalleryHeight(el); this.galleryContainerEl = el; }}>
          <InnerGalleryWrapper {...innerGalleryProps} />
        </div>
      </>
    );
  }

  private setGalleryHeight(el: HTMLElement|null) {
    if (!el) {
      return;
    }

    el.addEventListener('scroll', () => this.scrollObservable.triggerEvent({}));
    el.addEventListener('resize', () => this.resizeObservable.triggerEvent({}));

    const elementPosTopOffset = el.getBoundingClientRect().top;

    if (elementPosTopOffset === this.state.elementPosTopOffset) {
      return;
    }

    this.setState(state => ({...state, elementPosTopOffset }));
  }
}

export default connect(undefined, {
  fetchRecordsForTracks
})(GalleryWithFilter);
