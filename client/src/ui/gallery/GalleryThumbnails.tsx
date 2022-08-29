import { useState } from "react";
import { MediaFile } from "src/domain/MediaFile";
import AddFilesToCollectionModal from "./AddFilesToCollectionModal";
import GalleryRow from "./GalleryRow";
import { SelectThumbnailEventInfo } from "./GalleryThumbnail";
import { Row } from "./GalleryUtil";

type Props = {
  rows: Row[];
  lastIndexShown: number;
  onClickThumbnail?: (mediaFile: MediaFile) => void;
  isThumbnailVisible(el: HTMLElement): void;
};

export const ROWS_IN_INCREMENT = 10;

function GalleryThumbnails(props: Props) {
  const [showAddToCollectionModal, setShowAddToCollectionModal] =
    useState(false);
  const [selectedFiles, setSelectedFiles] = useState([] as MediaFile[]);

  const { rows, lastIndexShown, onClickThumbnail, isThumbnailVisible } = props;

  const rowsHtml = rows.map((row, index) => {
    if (index > lastIndexShown + ROWS_IN_INCREMENT) {
      // don't render anything below the cut
      return null;
    }

    const rowProps = {
      row,
      onClickThumbnail,
      isThumbnailVisible,
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
      <div className="container-fluid">
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
      <div>{rowsHtml}</div>
      {showAddToCollectionModal && (
        <AddFilesToCollectionModal
          files={selectedFiles}
          onClickClose={() => setShowAddToCollectionModal(false)}
        />
      )}
    </>
  );
}

export default GalleryThumbnails;
