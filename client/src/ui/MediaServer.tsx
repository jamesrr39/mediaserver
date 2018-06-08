import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';
import Gallery from './Gallery';
import { Observable } from '../util/Observable';
import { Route, Redirect, RouteComponentProps } from 'react-router';
import PictureModal from './PictureModal';
import { connect, Dispatch } from 'react-redux';
import { State } from '../reducers';
import { fetchPicturesMetadata } from '../actions';
import { HashRouter } from 'react-router-dom';
import { Action } from 'redux';
import MediaserverTopBar from './MediaserverTopBar';
import { fetchCollections } from '../collectionsActions';
import CollectionsComponent, {
  extractFolderCollectionsFromPicturesMetadatas
 } from './collections/CollectionsListingComponent';
import CollectionViewComponent from './collections/CollectionViewComponent';

interface MediaServerProps {
  picturesMetadatas: PictureMetadata[];
  scrollObservable: Observable;
  dispatch: Dispatch<Action>;
}

type CollectionViewRouteParams = {
  name: string;
  type: string;
};

class MediaServer extends React.Component<MediaServerProps> {
  componentWillMount() {
    this.props.dispatch(fetchPicturesMetadata());
    this.props.dispatch(fetchCollections());
  }

  renderCollectionView = (routeInfo: RouteComponentProps<CollectionViewRouteParams>) => {
    const name = decodeURIComponent(routeInfo.match.params.name);
    const type = decodeURIComponent(routeInfo.match.params.type);

    switch (type) {
      case 'folder':
        const collection = extractFolderCollectionsFromPicturesMetadatas(this.props.picturesMetadatas)
          .find(currentCollection => (currentCollection.name === name));
        if (!collection) {
          throw new Error('no collection found');
        }
        return <CollectionViewComponent {...{collection}} />;
      default:
        throw new Error('type not found');
    }
  }

  render() {
    return (
      <div>
        <HashRouter>
          <div>
            <MediaserverTopBar />
            <Route path="/collections" exact={true} component={CollectionsComponent} />
            <Route path="/collections/:type/:name" render={this.renderCollectionView} />
            <Route path="/gallery" component={Gallery} />
            <Route path="/gallery/picture/:hash" component={PictureModal} />
            <Route path="/" exact={true} render={() => (<Redirect to="/gallery" />)} />
          </div>
        </HashRouter>
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  const { picturesMetadatas, scrollObservable } = state.picturesMetadatas;

  return {
    picturesMetadatas,
    scrollObservable,
  };
}

export default connect(mapStateToProps, null, null, {pure: false})(MediaServer);
