import * as React from "react";
import { createCompareTimeTakenFunc } from "../../domain/PictureMetadata";

import { TrackMapData } from "../MapComponent";
import { MediaFile } from "../../domain/MediaFile";
import { filesToRows } from "./GalleryRow";
import {
  mediaFilesToDateGroups,
  groupsMapToGroups,
} from "../../domain/MediaFileGroup";
import { InnerMap } from "./InnerMap";
import { PeopleMap } from "../../actions/mediaFileActions";
import GalleryThumbnails, { ROWS_IN_INCREMENT } from "./GalleryThumbnails";
import GalleryFilter from "src/domain/filter/GalleryFilter";
import { ScrollResizeContext, WindowContext } from "src/context/WindowContext";
import { Row } from "./GalleryUtil";

export const gallerySortingFunc = createCompareTimeTakenFunc(true);

export type Props = {
  showMap: boolean;
  filter: GalleryFilter;
  onClickThumbnail?: (mediaFile: MediaFile) => void;
  mediaFiles: MediaFile[];
  mediaFileUrlBase?: string;
  peopleMap: PeopleMap;
  isThumbnailVisible(el: HTMLElement): void;
};

type ComponentState = {
  rows: Row[];
  setRows: (rows: Row[]) => void;
  lastIndexShown: number;
  setLastIndexShown: (lastIndex: number) => void;
};

function useScrollOrResize(mediaFiles: MediaFile[], state: ComponentState) {
  const { rows, setRows, lastIndexShown, setLastIndexShown } = state;

  const scrollResizeContext = React.useContext(ScrollResizeContext);
  const windowContext = React.useContext(WindowContext);
  const rowWidth = windowContext.innerWidth;

  const setRowsState = () => {
    const groupsMap = mediaFilesToDateGroups(mediaFiles);
    const groups = groupsMapToGroups(groupsMap);
    const newRows = filesToRows(rowWidth, groups);

    if (newRows.length !== rows.length) {
      setRows(newRows);
    }
  };

  const calculateAndSetLastIndexAndRowsState = () => {
    console.log("onScrollOrResize");

    if (lastIndexShown >= mediaFiles.length) {
      // we are already showing everything
      return;
    }

    setRowsState();

    const scrolledTo = window.scrollY;
    const bodyHeight = document.documentElement.scrollHeight;
    const viewportHeight = document.documentElement.clientHeight;

    const distanceFromBottom = bodyHeight - (scrolledTo + viewportHeight);
    if (distanceFromBottom < viewportHeight) {
      setLastIndexShown(lastIndexShown + ROWS_IN_INCREMENT);
    }
  };

  React.useEffect(() => {
    scrollResizeContext.addListener(calculateAndSetLastIndexAndRowsState);

    // call manually after the first time render
    calculateAndSetLastIndexAndRowsState();

    return () =>
      scrollResizeContext.removeListener(calculateAndSetLastIndexAndRowsState);
  }, []);
}

function Gallery(props: Props) {
  const {
    mediaFileUrlBase,
    mediaFiles,
    showMap,
    filter,
    peopleMap,
    isThumbnailVisible,
  } = props;
  const [lastIndexShown, setLastIndexShown] = React.useState(0);
  const [rows, setRows] = React.useState([] as Row[]);
  useScrollOrResize(mediaFiles, {
    rows,
    setRows,
    lastIndexShown,
    setLastIndexShown,
  });

  return (
    <>
      {showMap && (
        <InnerMap mediaFiles={mediaFiles} mediaFileUrlBase={mediaFileUrlBase} />
      )}
      <div>
        <GalleryThumbnails
          rows={rows}
          lastIndexShown={lastIndexShown}
          filter={filter}
          peopleMap={peopleMap}
          isThumbnailVisible={isThumbnailVisible}
          mediaFileUrlBase={mediaFileUrlBase}
        />
      </div>
    </>
  );
}

export default Gallery;
