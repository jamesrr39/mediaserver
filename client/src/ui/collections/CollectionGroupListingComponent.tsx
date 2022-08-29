import * as React from "react";
import { Collection, CustomCollection } from "../../domain/Collection";
import CollectionThumbnail from "./CollectionThumbnail";
import { themeStyles } from "../../theme/theme";
import AddCollectionModal from "./AddCollectionModal";
import { saveCollection } from "../../actions/collectionsActions";
import { connect, useDispatch } from "react-redux";
import { joinUrlFragments } from "src/domain/util";
import { useState } from "react";
import { useMutation } from "react-query";

function useSaveCollectionMutation() {
  const dispatch = useDispatch();

  return useMutation(async (newCollection: CustomCollection) => {
    const returnedCollection = await saveCollection(newCollection)(dispatch);

    const encodedType = encodeURIComponent(returnedCollection.type);
    const encodedIdentifier = encodeURIComponent(
      returnedCollection.identifier()
    );
    window.location.hash = joinUrlFragments([
      "#/collections",
      encodedType,
      encodedIdentifier,
      "edit",
    ]);
  });
}

const styles = {
  collectionsWrapper: {
    display: "flex",
    flexWrap: "wrap",
  } as React.CSSProperties,
};

type Props = {
  title: string;
  collections: Collection[];
  canAddCollection?: boolean;
};

function CollectionGroupListingComponent(props: Props) {
  const { title, canAddCollection, collections } = props;
  const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);
  const saveCollectionMutation = useSaveCollectionMutation();

  return (
    <div>
      <div className="container-fluid">
        <h2>{title}</h2>
        {canAddCollection && (
          <button
            type="button"
            style={themeStyles.button}
            onClick={() => setShowAddCollectionModal(true)}
          >
            &#43; Add
          </button>
        )}
      </div>
      <div style={styles.collectionsWrapper}>
        {collections.length === 0 ? (
          <div className="container-fluid">None... yet</div>
        ) : (
          collections.map((collection, index) => {
            return (
              <div key={index}>
                <CollectionThumbnail collection={collection} />
              </div>
            );
          })
        )}
      </div>
      {showAddCollectionModal && (
        <AddCollectionModal
          onSubmit={(name) => {
            saveCollectionMutation.mutate(new CustomCollection(0, name, []));
          }}
          onCancel={() => setShowAddCollectionModal(false)}
        />
      )}
    </div>
  );
}

export default CollectionGroupListingComponent;
