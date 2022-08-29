import { useSelector } from "react-redux";
import { State } from "../reducers/rootReducer";
import GalleryWithFilter from "./gallery/GalleryWithFilter";

function AllPicturesGallery() {
  const { mediaFiles } = useSelector((state: State) => state.mediaFilesReducer);

  return (
    <GalleryWithFilter
      mediaFiles={mediaFiles}
      showMap={false}
      mediaFileUrlBase="/gallery/detail"
    />
  );
}

export default AllPicturesGallery;
