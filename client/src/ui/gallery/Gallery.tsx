import * as React from "react";
import { createCompareTimeTakenFunc } from "../../domain/PictureMetadata";

import {
  GalleryContainerContext,
  ScrollResizeContext,
  WindowContext,
} from "src/context/WindowContext";
import { MediaFile } from "../../domain/MediaFile";
import {
  groupsMapToGroups,
  mediaFilesToDateGroups,
} from "../../domain/MediaFileGroup";
import { filesToRows } from "./GalleryRow";
import GalleryThumbnails, { ROWS_IN_INCREMENT } from "./GalleryThumbnails";
import { Row } from "./GalleryUtil";
import GeographicMap from "./GeographicMap";

export const gallerySortingFunc = createCompareTimeTakenFunc(true);

export type Props = {
  showMap: boolean;
  onClickThumbnail?: (mediaFile: MediaFile) => void;
  mediaFiles: MediaFile[];
  mediaFileUrlBase?: string;
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
  }, [mediaFiles]);
}

function Gallery(props: Props) {
  const { mediaFileUrlBase, mediaFiles, showMap } = props;

  mediaFiles.sort(gallerySortingFunc);

  const [lastIndexShown, setLastIndexShown] = React.useState(0);
  const [rows, setRows] = React.useState([] as Row[]);
  useScrollOrResize(mediaFiles, {
    rows,
    setRows,
    lastIndexShown,
    setLastIndexShown,
  });

  const galleryEl = React.useRef();

  return (
    <>
      {showMap && (
        <GeographicMap
          mediaFiles={mediaFiles}
          mediaFileUrlBase={mediaFileUrlBase}
        />
      )}
      <div ref={galleryEl}>
        <GalleryContainerContext.Provider value={galleryEl?.current}>
          <GalleryThumbnails rows={rows} lastIndexShown={lastIndexShown} />
        </GalleryContainerContext.Provider>
      </div>
    </>
  );
}

export default Gallery;
