import * as React from "react";
import { createCompareTimeTakenFunc } from "../../domain/PictureMetadata";

import { Observable } from "ts-util/src/Observable";
import { TrackMapData } from "../MapComponent";
import { MediaFile } from "../../domain/MediaFile";
import { MediaFileType } from "../../domain/MediaFileType";
import { FitTrack, Record } from "../../domain/FitTrack";
import GalleryFilter from "../../domain/filter/GalleryFilter";
import Gallery from "./Gallery";
import { CancellablePromise } from "ts-util/src/Promises";
import { PeopleMap } from "../../actions/mediaFileActions";
import { DateFilter } from "src/domain/filter/DateFilter";

export const gallerySortingFunc = createCompareTimeTakenFunc(true);

type GalleryState = {
  showMap: boolean;
  tracks: TrackMapData[];
  galleryFilter: GalleryFilter;
};

type GalleryWrapperProps = {
  onFilterChangeObservable: Observable<GalleryFilter>;
  mediaFiles: MediaFile[];
  mediaFileUrlBase?: string; // example: `/gallery/detail`. If undefined, no link should be added.
  onClickThumbnail?: (pictureMetadata: MediaFile) => void;
  showMap?: boolean;
  peopleMap: PeopleMap;
  isThumbnailVisible(el: HTMLElement): void;
};

class GalleryWrapper extends React.Component<
  GalleryWrapperProps,
  GalleryState
> {
  state = {
    showMap: this.props.showMap || false,
    tracks: [],
    galleryFilter: new GalleryFilter(
      new DateFilter({ includeFilesWithoutDates: true })
    ),
  };

  private fetchRecordsPromise?: CancellablePromise<Map<string, Record[]>>;

  componentDidMount() {
    const { mediaFiles, onFilterChangeObservable } = this.props;
    const tracks: FitTrack[] = [];

    mediaFiles.forEach((mediaFile) => {
      if (mediaFile.fileType !== MediaFileType.FitTrack) {
        return;
      }

      tracks.push(mediaFile);
    });

    onFilterChangeObservable.addListener(this.filterChangeCallback);
  }

  componentWillUnmount() {
    this.props.onFilterChangeObservable.removeListener(
      this.filterChangeCallback
    );
    if (this.fetchRecordsPromise) {
      this.fetchRecordsPromise.cancel();
    }
  }

  render() {
    const {
      isThumbnailVisible,
      peopleMap,
      onClickThumbnail,
      mediaFileUrlBase,
    } = this.props;
    const { showMap, tracks, galleryFilter } = this.state;
    const mediaFiles = this.props.mediaFiles.filter(galleryFilter.filter);

    mediaFiles.sort(gallerySortingFunc);

    return (
      <Gallery
        showMap={showMap}
        tracks={tracks}
        filter={galleryFilter}
        onClickThumbnail={onClickThumbnail}
        mediaFiles={mediaFiles}
        mediaFileUrlBase={mediaFileUrlBase}
        peopleMap={peopleMap}
        isThumbnailVisible={isThumbnailVisible}
      />
    );
  }

  private filterChangeCallback = (galleryFilter: GalleryFilter) => {
    this.setState((state) => ({
      ...state,
      galleryFilter,
    }));
  };
}

export default GalleryWrapper;
