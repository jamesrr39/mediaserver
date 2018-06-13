import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';
import AllPicturesGallery from './AllPicturesGallery';
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
import CollectionsComponent from './collections/CollectionsListingComponent';
import CollectionViewComponent from './collections/CollectionViewComponent';
import { extractFolderCollectionsFromPicturesMetadatas } from '../domain/Collection';
import NotFoundComponent from './NotFoundComponent';
import NotificationBarComponent from './NotificationBarComponent';

type CollectionViewRouteParams = {
  name: string;
  type: string;
};

type CollectionPictureModalRouteParams = {
  name: string;
  type: string;
  hash: string;
};

type AllPicturesPictureModalRouteParams = {
  hash: string;
};

interface MediaServerProps {
  picturesMetadatas: PictureMetadata[];
  scrollObservable: Observable;
  picturesMetadatasMap: Map<string, PictureMetadata>;
  dispatch: Dispatch<Action>;
}

function findCollectionFromTypeAndName(
  picturesMetadatas: PictureMetadata[], collectionType: string, collectionName: string) {
  switch (collectionType) {
    case 'folder':
      const collection = extractFolderCollectionsFromPicturesMetadatas(picturesMetadatas)
        .find(currentCollection => (currentCollection.name === collectionName));
      return collection;
    default:
      throw new Error(`unrecognised type ${collectionType}`);
    }
}

const styles = {
  notificationsComponent: {
    position: 'fixed',
    left: '30px',
    bottom: '30px',
  } as React.CSSProperties,
};

class MediaServer extends React.Component<MediaServerProps> {
  componentWillMount() {
    this.props.dispatch(fetchPicturesMetadata());
    this.props.dispatch(fetchCollections());
  }

  renderCollectionView = (routeInfo: RouteComponentProps<CollectionViewRouteParams>) => {
    const name = decodeURIComponent(routeInfo.match.params.name);
    const type = decodeURIComponent(routeInfo.match.params.type);

    const collection = findCollectionFromTypeAndName(this.props.picturesMetadatas, type, name);
    if (!collection) {
      return <NotFoundComponent message={'no collection found'} />;
    }
    const props = {
      collection,
      picturesMetadatasMap: this.props.picturesMetadatasMap,
      routeUrl: `/collections/${routeInfo.match.params.type}/${routeInfo.match.params.name}`,
    };

    return <CollectionViewComponent {...props} />;
  }

  renderAllPicturesPictureModal = (routeInfo: RouteComponentProps<AllPicturesPictureModalRouteParams>) => {
    const props = {
      picturesMetadatas: this.props.picturesMetadatas,
      hash: routeInfo.match.params.hash,
      baseUrl: '/gallery',
    };

    return <PictureModal {...props} />;
  }

  renderCollectionPicture = (routeInfo: RouteComponentProps<CollectionPictureModalRouteParams>) => {
    const name = decodeURIComponent(routeInfo.match.params.name);
    const type = decodeURIComponent(routeInfo.match.params.type);
    const hash = decodeURIComponent(routeInfo.match.params.hash);

    const collection = findCollectionFromTypeAndName(this.props.picturesMetadatas, type, name);
    if (!collection) {
      return <NotFoundComponent message={'no picture found'} />;
    }

    const picturesMetadatas = collection.hashes.map(hashInCollection => {
      return this.props.picturesMetadatasMap.get(hashInCollection);
    });

    const props = {
      // collection,
      picturesMetadatas,
      hash,
      baseUrl: `/collections/${routeInfo.match.params.type}/${routeInfo.match.params.name}`,
    };

    return <PictureModal {...props}/>;
  }

  render() {
    return (
      <div>
        <HashRouter>
          <div>
            <MediaserverTopBar />
            <Route path="/collections" exact={true} component={CollectionsComponent} />
            <Route path="/collections/:type/:name" render={this.renderCollectionView} />
            <Route path="/collections/:type/:name/picture/:hash" render={this.renderCollectionPicture} />
            <Route path="/gallery" component={AllPicturesGallery} />
            <Route path="/gallery/picture/:hash" render={this.renderAllPicturesPictureModal} />
            <Route path="/" exact={true} render={() => (<Redirect to="/gallery" />)} />
            <div style={styles.notificationsComponent}>
              <NotificationBarComponent />
            </div>
          </div>
        </HashRouter>
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  const { picturesMetadatas, scrollObservable, picturesMetadatasMap } = state.picturesMetadatas;

  return {
    picturesMetadatas,
    scrollObservable,
    picturesMetadatasMap,
  };
}

export default connect(mapStateToProps, null, null, {pure: false})(MediaServer);
