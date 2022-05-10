import { useState } from "react";
import { useQuery } from "react-query";
import { useDispatch } from "react-redux";
import {
  fetchCollections,
  saveCollection,
} from "src/actions/collectionsActions";
import { CustomCollection } from "src/domain/Collection";
import { MediaFile } from "src/domain/MediaFile";
import PopupModal from "src/ui/modals/PopupModal";

type Props = {
  files: MediaFile[];
  onClickClose: () => void;
};

export default function AddFilesToCollectionModal(props: Props) {
  const { files } = props;
  const dispatch = useDispatch();

  const [creatingNewCollection, setCreatingNewCollection] = useState(false);

  const { isLoading, error, data } = useQuery(`collections`, () =>
    fetchCollections()(dispatch)
  );

  if (error) {
    return <div className="alert alert-danger">Error</div>;
  }

  if (isLoading) {
    return <div className="alert alert-info">Loading</div>;
  }

  if (creatingNewCollection) {
    return (
      <PopupModal onClickClose={() => setCreatingNewCollection(false)}>
        <form
          onSubmit={async (event) => {
            event.preventDefault();

            const { elements } = event.target as typeof event.target & {
              elements: { name: { value: string } };
            };

            const collection = await saveCollection(
              new CustomCollection(0, elements.name.value, [])
            )(dispatch);
            setCreatingNewCollection(false);
          }}
        >
          <label>
            Collection Name: <input name="name" type="text" />
          </label>
          <button type="submit">Create</button>
        </form>
      </PopupModal>
    );
  }

  return (
    <PopupModal onClickClose={() => props.onClickClose()}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();

          const { elements } = event.target as typeof event.target & {
            elements: {
              collectionIds: HTMLSelectElement;
            };
          };

          const optionTags =
            elements.collectionIds.getElementsByTagName("option");

          const collectionIds = [] as number[];

          for (let i = 0; i < optionTags.length; i++) {
            const optionTag = optionTags.item(i);

            if (optionTag.selected) {
              collectionIds.push(parseInt(optionTag.value, 10));
            }
          }

          const allCollectionsMap = new Map<number, CustomCollection>();
          data.customCollections.forEach((collection) =>
            allCollectionsMap.set(collection.id, collection)
          );

          for (let collectionId of collectionIds) {
            const collection = allCollectionsMap.get(collectionId);
            if (!collection) {
              alert("couldn't get collection?");
              return;
            }

            const fileHashesInCollectionMap = new Set<string>();
            collection.fileHashes.forEach((hash) =>
              fileHashesInCollectionMap.add(hash)
            );

            props.files.forEach((file) => {
              if (fileHashesInCollectionMap.has(file.hashValue)) {
                // hash already in collection, do nothing
                return;
              }
              collection.fileHashes.push(file.hashValue);
            });

            await saveCollection(collection)(dispatch);
          }
        }}
      >
        <h3>Add to collection</h3>
        {data.customCollections.length === 0 && <p>No collections... yet!</p>}
        {data.customCollections.length !== 0 && (
          <div>
            <select
              className="form-select"
              name="collectionIds"
              multiple={true}
            >
              {data.customCollections.map((collection) => {
                return (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                );
              })}
            </select>
          </div>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setCreatingNewCollection(true)}
        >
          Add collection
        </button>
        {files.map((file, idx) => (
          <p key={idx}>{file.relativePath}</p>
        ))}
        <button type="submit" className="btn btn-primary">
          Add pictures to album
        </button>
      </form>
    </PopupModal>
  );
}
