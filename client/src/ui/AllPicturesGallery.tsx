import { useState } from "react";
import { useSelector } from "react-redux";
import { SelectThumbnailContext } from "src/context/SelectThumbnailContext";
import { MediaFile } from "src/domain/MediaFile";
import { State } from "../reducers/rootReducer";
import AddFilesToCollectionModal from "./gallery/AddFilesToCollectionModal";
import GalleryWithFilter from "./gallery/GalleryWithFilter";

function AllPicturesGallery() {
  const { mediaFiles } = useSelector((state: State) => state.mediaFilesReducer);

  const [selectedFiles, setSelectedFiles] = useState([] as MediaFile[]);
  const [showAddToCollectionModal, setShowAddToCollectionModal] =
    useState(false);

  const onSelectThumbnail = (mediaFile: MediaFile, selected: boolean) => {
    if (selected) {
      setSelectedFiles(selectedFiles.concat([mediaFile]));
      return;
    }

    // deselected, so remove the selected entry
    const newSelectedFiles = selectedFiles.filter(
      (mediaFileInList: MediaFile) =>
        mediaFile.hashValue !== mediaFileInList.hashValue
    );

    setSelectedFiles(newSelectedFiles);
  };

  return (
    <SelectThumbnailContext.Provider value={onSelectThumbnail}>
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
      <GalleryWithFilter
        mediaFiles={mediaFiles}
        showMap={false}
        mediaFileUrlBase="/gallery/detail"
      />
      {showAddToCollectionModal && (
        <AddFilesToCollectionModal
          files={selectedFiles}
          onClickClose={() => setShowAddToCollectionModal(false)}
        />
      )}
    </SelectThumbnailContext.Provider>
  );
}

export default AllPicturesGallery;
