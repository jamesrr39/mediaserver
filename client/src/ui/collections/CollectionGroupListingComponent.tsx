import * as React from 'react';
import { Collection, CustomCollection } from '../../domain/Collection';
import CollectionThumbnail from './CollectionThumbnail';
import { themeStyles } from '../../theme/theme';
import AddCollectionModal from './AddCollectionModal';
import { saveCollection, CollectionsAction } from '../../collectionsActions';
// import { connect } from 'react-redux';
import { Dispatch } from 'redux';
// import { withRouter } from 'react-router';
import { connect } from 'react-redux';

const styles = {
  collectionsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  } as React.CSSProperties,
};

type Props = {
  dispatch: Dispatch<CollectionsAction>;
  title: string,
  collections: Collection[],
  canAddCollection?: boolean,
};

type ComponentState = {
  showAddCollectionModal: boolean,
};

class CollectionGroupListingComponent extends React.Component<Props, ComponentState> {
  state = {
    showAddCollectionModal: false,
  };

  render() {
    const itemsHtml = this.props.collections.map((collection, index) => {
      const props = {
        collection,
      };

      return (
        <div key={index}>
          <CollectionThumbnail {...props} />
        </div>
      );
    });

    const addCollectionModal = this.state.showAddCollectionModal
      ? (
        <AddCollectionModal
          onSubmit={(name) => this.onAddCollectionModalSubmit(name)}
          onCancel={() => this.onAddCollectionModalCancel()}
        />
      )
      : null;

    return (
      <div>
        <h2>{this.props.title}</h2>
        {this.renderAddCollectionBtn()}
        <div style={styles.collectionsWrapper}>
          {itemsHtml}
        </div>
        {addCollectionModal}
      </div>
    );
  }

  private renderAddCollectionBtn = () => {
    if (!this.props.canAddCollection) {
      return null;
    }

    return (
      <button
        type="button"
        style={themeStyles.button}
        onClick={() => {this.setState(state => ({...state, showAddCollectionModal: true})); }}
      >
        &#43; Add
      </button>
    );
  }

  private onAddCollectionModalCancel = () => {
    this.setState(state => ({
      ...state,
      showAddCollectionModal: false,
    }));
  }

  private onAddCollectionModalSubmit = (name: string) => {
    const newCollection = new CustomCollection(0, name, []);
    this.saveCollection(newCollection);
  }

  private async saveCollection(newCollection: CustomCollection) {
    const { dispatch } = this.props;

    const returnedCollection = await saveCollection(newCollection)(dispatch);

    const encodedType = encodeURIComponent(returnedCollection.type);
    const encodedIdentifier = encodeURIComponent(returnedCollection.identifier());
    window.location.hash = `#/collections/${encodedType}/${encodedIdentifier}/edit`;
  }
}

export default connect(
  state => undefined,
)(CollectionGroupListingComponent);
