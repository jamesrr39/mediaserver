import { useState } from "react";
import { Observable } from "ts-util/src/Observable";
import { PeopleMap } from "src/actions/mediaFileActions";
import { MediaFile } from "src/domain/MediaFile";
import GalleryRow, { Row } from "./GalleryRow";
import { BuildLinkFunc, SelectThumbnailEventInfo } from "./GalleryThumbnail";

type Props = {
  rows: Row[];
  lastIndexShown: number;

  filterJson: string;
  scrollObservable: Observable<void>;
  resizeObservable: Observable<void>;
  onClickThumbnail?: (mediaFile: MediaFile) => void;
  mediaFileUrlBase?: string;
  peopleMap: PeopleMap;
  getRowWidth: () => number;
  isThumbnailVisible(el: HTMLElement): void;
};

export const ROWS_IN_INCREMENT = 10;

function InnerGalleryThumbnails(props: Props) {
  const [showAddToCollectionModal, setShowAddToCollectionModal] =
    useState(false);
  const [selectedFiles, setSelectedFiles] = useState([] as MediaFile[]);

  const {
    rows,
    lastIndexShown,

    onClickThumbnail,
    mediaFileUrlBase,
    filterJson,
    getRowWidth,
    isThumbnailVisible,
    scrollObservable,
    resizeObservable,
    peopleMap,
  } = props;

  let buildLink: undefined | BuildLinkFunc = undefined;
  if (mediaFileUrlBase) {
    buildLink = (mediaFile: MediaFile) => {
      const query = `filterJson=${encodeURIComponent(filterJson)}`;
      const linkUrl = `${mediaFileUrlBase}/${mediaFile.hashValue}?${query}`;
      return linkUrl;
    };
  }

  const rowsHtml = rows.map((row, index) => {
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
          setSelectedFiles(selectedFiles.concat([mediaFile]));
          return;
        }

        // deselected, so remove the selected entry
        const copyOfSelectedFiles = selectedFiles.concat([]);
        const indexOfRemovedFileFromSelection = selectedFiles.findIndex(
          (mediaFileInList: MediaFile) => {
            return mediaFile.hashValue === mediaFileInList.hashValue;
          }
        );
        copyOfSelectedFiles.splice(indexOfRemovedFileFromSelection, 1);

        setSelectedFiles(copyOfSelectedFiles);
      },
    };

    return <GalleryRow key={index} {...rowProps} />;
  });

  return (
    <>
      <div>
        <div>
          {selectedFiles.length} files selected{" "}
          <button
            disabled={selectedFiles.length === 0}
            className="btn btn-primary"
            type="button"
            onClick={(event) => {
              event.preventDefault();

              setShowAddToCollectionModal(true);
            }}
          >
            Add to collection
          </button>
        </div>
      </div>
      <div>{rowsHtml}</div>
    </>
  );
}

export default InnerGalleryThumbnails;
