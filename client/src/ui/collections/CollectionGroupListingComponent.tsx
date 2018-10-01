import * as React from 'react';
import { Collection, CustomCollection } from '../../domain/Collection';
import CollectionThumbnail from './CollectionThumbnail';
import { themeStyles } from '../../theme/theme';
import AddCollectionModal from './AddCollectionModal';
import { saveCollection } from '../../collectionsActions';
import { Dispatch, connect } from 'react-redux';
import { Action } from 'redux';
import { History } from 'history';
import { withRouter } from 'react-router';
import { compose } from 'redux';

const styles = {
  collectionsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  } as React.CSSProperties,
};

type Props = {
  dispatch: Dispatch<Action>;
  history: History;
  title: string,
  collections: Collection[],
  canAddCollection?: boolean,
};

type State = {
  showAddCollectionModal: boolean,
};

class CollectionGroupListingComponent extends React.Component<Props, State> {
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

    const { dispatch, history } = this.props;

    const newCollection = new CustomCollection(0, name, []);
    const onSuccess = (returnedCollection: Collection) => {
      const encodedType = encodeURIComponent(returnedCollection.type);
      const encodedIdentifier = encodeURIComponent(returnedCollection.identifier());
      const successUrl = `/collections/${encodedType}/${encodedIdentifier}/edit`;
      history.push(successUrl);
    };

    dispatch(
      saveCollection(
        newCollection,
        onSuccess,
      ),
    );
  }
}

function mapStateToProps(state: State) {
  return {};
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(CollectionGroupListingComponent);
