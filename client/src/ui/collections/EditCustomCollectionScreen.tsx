import { useParams } from "react-router-dom";
import { PeopleMap } from "../../actions/mediaFileActions";
import { CollectionType, CustomCollection } from "../../domain/Collection";
import NotFoundComponent from "../NotFoundComponent";
import EditCustomCollectionComponent from "./EditCustomCollectionComponent";

type Props = {
  customCollections: CustomCollection[];
  peopleMap: PeopleMap;
};

export function EditCustomCollectionScreen(props: Props) {
  const { identifier, type } = useParams<{
    identifier: string;
    type: string;
  }>();

  if (type !== CollectionType.Custom) {
    return <NotFoundComponent message={`can't edit type '${type}'`} />;
  }

  const collection = props.customCollections.find(
    (customCollection) => customCollection.identifier() === identifier
  );
  if (!collection) {
    return <NotFoundComponent message={"no collection found"} />;
  }

  return (
    <EditCustomCollectionComponent
      collection={collection}
      peopleMap={props.peopleMap}
    />
  );
}
