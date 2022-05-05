import * as React from "react";
import { createCompareTimeTakenFunc } from "../../domain/PictureMetadata";

import { TrackMapData } from "../MapComponent";
import { MediaFile } from "../../domain/MediaFile";
import GalleryRow, { filesToRows, Row } from "./GalleryRow";
import {
  mediaFilesToDateGroups,
  groupsMapToGroups,
} from "../../domain/MediaFileGroup";
import { InnerMap } from "./InnerMap";
import { Observable } from "ts-util/dist/Observable";
import { PeopleMap } from "../../actions/mediaFileActions";
import { BuildLinkFunc, SelectThumbnailEventInfo } from "./GalleryThumbnail";
import { useState } from "react";
import InnerGalleryThumbnails, { ROWS_IN_INCREMENT } from "./GalleryThumbnails";

export const gallerySortingFunc = createCompareTimeTakenFunc(true);

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
};

class InnerGallery extends React.Component<
  InnerGalleryProps,
  InnerGalleryState
> {
  state = {
    lastIndexShown: 0,
    rows: [],
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
        <div>
          <InnerGalleryThumbnails
            rows={this.state.rows}
            lastIndexShown={this.state.lastIndexShown}
            {...this.props}
          />
        </div>
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
