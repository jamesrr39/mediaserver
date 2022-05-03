import { Link, useParams } from "react-router-dom";
import { PeopleMap } from "../../actions/mediaFileActions";
import {
  Collection,
  CollectionType,
  CustomCollection,
  findCollectionFromTypeAndName,
} from "../../domain/Collection";
import { MediaFile } from "../../domain/MediaFile";
import NotFoundComponent from "../NotFoundComponent";
import CollectionViewComponent from "./CollectionViewComponent";

type Params = {
  type: string;
  identifier: string;
};

type Props = {
  mediaFiles: MediaFile[];
  customCollections: CustomCollection[];
  peopleMap: PeopleMap;
};

function CollectionViewScreen(props: Props) {
  const params = useParams<Params>();
  const type = decodeURIComponent(params.type || "");
  const identifier = decodeURIComponent(params.identifier || "");

  const { mediaFiles, customCollections, peopleMap } = props;

  const collection = findCollectionFromTypeAndName(
    mediaFiles,
    type as CollectionType,
    identifier,
    customCollections
  );

  if (!collection) {
    return <NotFoundComponent message={"no collection found"} />;
  }

  const encodedType = encodeURIComponent(type);
  const encodedIdentifier = encodeURIComponent(identifier);

  return (
    <CollectionViewComponent
      collection={collection}
      peopleMap={props.peopleMap}
      routeUrl={`/collections/${encodedType}/${encodedIdentifier}`}
    />
  );
}

export default CollectionViewScreen;

type CollectionViewNavBarProps = {
  mediaFiles: MediaFile[];
  customCollections: CustomCollection[];
};

export const CollectionViewNavBarComponent = (
  props: CollectionViewNavBarProps
) => {
  const params = useParams<Params>();

  const collection = findCollectionFromTypeAndName(
    props.mediaFiles,
    params.type as CollectionType,
    params.identifier || "",
    props.customCollections
  );

  if (!collection) {
    return null;
  }

  const editUrl = `collections/${encodeURIComponent(
    collection.type
  )}/${encodeURIComponent(collection.identifier())}/edit`;

  return (
    <Link className="btn btn-primary" to={editUrl}>
      &#9998; Edit
    </Link>
  );
};
