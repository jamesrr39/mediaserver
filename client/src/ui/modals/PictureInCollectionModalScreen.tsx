import { useParams } from "react-router-dom";
import {
  CollectionType,
  CustomCollection,
  findCollectionFromTypeAndName,
} from "../../domain/Collection";
import { MediaFile } from "../../domain/MediaFile";
import NotFoundComponent from "../NotFoundComponent";
import MediaFileModal from "./MediaFileModal";

type Params = {
  identifier: string;
  type: string;
  hash: string;
};

type Props = {
  mediaFilesMap: Map<string, MediaFile>;
  mediaFiles: MediaFile[];
  customCollections: CustomCollection[];
};

function PictureInCollectionModalScreen(props: Props) {
  const params = useParams<Params>();

  const name = decodeURIComponent(params.identifier || "");
  const type = decodeURIComponent(params.type || "");
  const hash = decodeURIComponent(params.hash || "");

  const collection = findCollectionFromTypeAndName(
    props.mediaFiles,
    type as CollectionType,
    name,
    props.customCollections
  );
  if (!collection) {
    return <NotFoundComponent message={"no picture found"} />;
  }

  const mediaFiles = collection.fileHashes.map((hashInCollection) => {
    const mediaFile = props.mediaFilesMap.get(hashInCollection);
    if (!mediaFile) {
      throw new Error(
        `unexpected error: could not find picture metadata for hash ${hashInCollection}`
      );
    }

    return mediaFile;
  });

  return (
    <MediaFileModal
      mediaFiles={mediaFiles}
      hash={hash}
      baseUrl={`/collections/${params.type}/${params.identifier}`}
    />
  );
}

export default PictureInCollectionModalScreen;
