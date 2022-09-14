import { useSelector } from "react-redux";
import {
  BuildLinkContext,
  createBuildLinkFunc,
} from "src/context/BuildLinkContext";
import { DateFilter } from "src/domain/filter/DateFilter";
import GalleryFilter from "src/domain/filter/GalleryFilter";
import { joinUrlFragments } from "src/domain/util";
import { Collection } from "../../domain/Collection";
import { State } from "../../reducers/rootReducer";
import Gallery from "../gallery/Gallery";
import GeographicMap from "../gallery/InnerMap";

type Props = {
  collection: Collection;
  routeUrl: string;
};

function CollectionViewComponent(props: Props) {
  const { collection, routeUrl } = props;
  const { mediaFilesMap } = useSelector(
    (state: State) => state.mediaFilesReducer
  );

  const mediaFiles = collection.fileHashes.map((hash) => {
    const mediaFile = mediaFilesMap.get(hash);
    if (!mediaFile) {
      throw new Error(`couldn't find media file for ${hash}`);
    }
    return mediaFile;
  });

  const buildLinkFunc = createBuildLinkFunc(
    new GalleryFilter(new DateFilter()),
    "/" +
      joinUrlFragments([
        "collections",
        encodeURIComponent(collection.type),
        encodeURIComponent(collection.identifier()),
        "detail",
      ])
  );

  return (
    <>
      <div className="container-fluid">
        <h1>{collection.name}</h1>
      </div>
      <GeographicMap mediaFiles={mediaFiles} />
      <BuildLinkContext.Provider value={buildLinkFunc}>
        <Gallery
          mediaFiles={mediaFiles}
          mediaFileUrlBase={`${routeUrl}/detail`}
          showMap={true}
        />
      </BuildLinkContext.Provider>
    </>
  );
}

export default CollectionViewComponent;
