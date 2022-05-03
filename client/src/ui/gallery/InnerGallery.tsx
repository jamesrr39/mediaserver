import * as React from "react";
import { createCompareTimeTakenFunc } from "../../domain/PictureMetadata";

import { TrackMapData } from "../MapComponent";
import { MediaFile } from "../../domain/MediaFile";
import GalleryRow, {
  filesToRows,
  BuildLinkFunc,
  Row,
  SelectThumbnailEventInfo,
} from "./GalleryRow";
import {
  mediaFilesToDateGroups,
  groupsMapToGroups,
} from "../../domain/MediaFileGroup";
import { InnerMap } from "./InnerMap";
import { Observable } from "ts-util/dist/Observable";
import { PeopleMap } from "../../actions/mediaFileActions";

export const gallerySortingFunc = createCompareTimeTakenFunc(true);

const ROWS_IN_INCREMENT = 10;

export type InnerGalleryProps = {
  showMap: boolean;
  tracks: TrackMapData[];
  filterJson: string;
  scrollObservable: Observable<void>;
  resizeObservable: Observable<void>;
  onClickThumbnail?: (mediaFile: MediaFile) => void;
  mediaFiles: MediaFile[];
  mediaFileUrlBase?: string;
  peopleMap: PeopleMap;
  getRowWidth: () => number;
  isThumbnailVisible(el: HTMLElement): void;
};

type InnerGalleryState = {
  lastIndexShown: number;
  rows: Row[];
  selectedFiles: MediaFile[];
};

class InnerGallery extends React.Component<
  InnerGalleryProps,
  InnerGalleryState
> {
  state = {
    lastIndexShown: 0,
    rows: [],
    selectedFiles: [],
  };

  componentDidMount() {
    const { scrollObservable, resizeObservable } = this.props;

    [scrollObservable, resizeObservable].forEach((observable) => {
      observable.triggerEvent();
      observable.addListener(this.onScroll);
      observable.addListener(this.onResize);
    });
  }

  componentWillUnmount() {
    const { scrollObservable, resizeObservable } = this.props;

    [scrollObservable, resizeObservable].forEach((observable) => {
      observable.removeListener(this.onScroll);
      observable.removeListener(this.onResize);
    });
  }

  componentDidUpdate() {
    this.props.scrollObservable.triggerEvent();
    this.props.resizeObservable.triggerEvent();
  }

  render() {
    return (
      <>
        {this.props.showMap && this.renderMap()}
        <div>{this.renderThumbnails()}</div>
      </>
    );
  }

  private renderMap = () => {
    const { tracks, mediaFileUrlBase, mediaFiles } = this.props;

    const props = {
      tracks,
      mediaFileUrlBase,
      mediaFiles,
    };

    return <InnerMap {...props} />;
  };

  private renderThumbnails = () => {
    const {
      onClickThumbnail,
      mediaFileUrlBase,
      filterJson,
      getRowWidth,
      isThumbnailVisible,
      scrollObservable,
      resizeObservable,
      peopleMap,
    } = this.props;
    const { rows } = this.state;

    let buildLink: undefined | BuildLinkFunc = undefined;
    if (mediaFileUrlBase) {
      buildLink = (mediaFile: MediaFile) => {
        const query = `filterJson=${encodeURIComponent(filterJson)}`;
        const linkUrl = `${mediaFileUrlBase}/${mediaFile.hashValue}?${query}`;
        return linkUrl;
      };
    }

    const rowsHtml = rows.map((row, index) => {
      const { lastIndexShown } = this.state;
      if (index > lastIndexShown + ROWS_IN_INCREMENT) {
        // don't render anything below the cut
        return null;
      }

      const rowProps = {
        row,
        onClickThumbnail,
        buildLink,
        getRowWidth,
        isThumbnailVisible,
        peopleMap,
        scrollObservable,
        resizeObservable,
        onSelectThumbnail: (
          mediaFile: MediaFile,
          eventInfo: SelectThumbnailEventInfo
        ) => {
          if (eventInfo.selected) {
            this.setState((state) => ({
              ...state,
              selectedFiles: state.selectedFiles.concat([mediaFile]),
            }));
            return;
          }

          this.setState((state) => {
            const copyOfSelectedFiles = state.selectedFiles.concat([]);
            const indexOfDeletedFile = state.selectedFiles.findIndex(
              (mediaFileInList: MediaFile) => {
                return mediaFile.hashValue === mediaFileInList.hashValue;
              }
            );
            copyOfSelectedFiles.splice(indexOfDeletedFile, 1);

            return {
              ...state,
              selectedFiles: copyOfSelectedFiles,
            };
          });
        },
      };

      return <GalleryRow key={index} {...rowProps} />;
    });

    return (
      <>
        <div>{this.renderEditBox()}</div>
        <div>{rowsHtml}</div>
      </>
    );
  };

  private renderEditBox() {
    return <>{this.state.selectedFiles.length} files selected</>;
  }

  private onScroll = () => {
    const { lastIndexShown } = this.state;
    if (lastIndexShown >= this.props.mediaFiles.length) {
      // we are already showing everything
      return;
    }

    this.setRowsState();

    const scrolledTo = window.scrollY;
    const bodyHeight = document.documentElement.scrollHeight;
    const viewportHeight = document.documentElement.clientHeight;

    const distanceFromBottom = bodyHeight - (scrolledTo + viewportHeight);
    if (distanceFromBottom < viewportHeight) {
      this.setState((state) => ({
        ...state,
        lastIndexShown: state.lastIndexShown + ROWS_IN_INCREMENT,
      }));
    }
  };

  private onResize = () => {
    this.setRowsState();
  };

  private setRowsState() {
    const { mediaFiles, getRowWidth } = this.props;

    const groupsMap = mediaFilesToDateGroups(mediaFiles);
    const groups = groupsMapToGroups(groupsMap);
    const rows = filesToRows(getRowWidth(), groups);

    if (rows.length !== this.state.rows.length) {
      this.setState((state) => ({
        ...state,
        rows,
      }));
    }
  }
}

export default InnerGallery;
