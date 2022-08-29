import { useSelector } from "react-redux";
import { Collection } from "../../domain/Collection";
import { MediaFile } from "../../domain/MediaFile";
import { State } from "../../reducers/rootReducer";
import Gallery from "../gallery/Gallery";
import { InnerMap } from "../gallery/InnerMap";

type Props = {
  collection: Collection;
  routeUrl: string;
};

function CollectionViewComponent(props: Props) {
  const { collection, routeUrl } = props;
  const { mediaFilesMap } = useSelector(
    (state: State) => state.mediaFilesReducer
  );

  const mediaFiles = collection.fileHashes.map((hash, index) => {
    const mediaFile = mediaFilesMap.get(hash);
    if (!mediaFile) {
      throw new Error(`couldn't find media file for ${hash}`);
    }
    return mediaFile;
  });

  return (
    <>
      <div className="container-fluid">
        <h1>{collection.name}</h1>
      </div>
      <InnerMap mediaFiles={mediaFiles} />
      <Gallery
        mediaFiles={mediaFiles}
        mediaFileUrlBase={`${routeUrl}/detail`}
        showMap={true}
        isThumbnailVisible={() => true} // TODO: replace
      />
    </>
  );
}

export default CollectionViewComponent;
