import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';
import AllPicturesGallery from './AllPicturesGallery';
import { Observable } from '../util/Observable';
import { Route, Redirect, RouteComponentProps, Switch } from 'react-router';
import PictureModal from './PictureModal';
import { connect, Dispatch } from 'react-redux';
import { State } from '../reducers';
import { fetchPicturesMetadata } from '../actions';
import { HashRouter } from 'react-router-dom';
import { Action } from 'redux';
import MediaserverTopBar from './MediaserverTopBar';
import { fetchCollections } from '../collectionsActions';
import CollectionsComponent from './collections/CollectionsListingComponent';
import CollectionViewComponent, { CollectionViewNavBarComponent } from './collections/CollectionViewComponent';
import { extractFolderCollectionsFromPicturesMetadatas, CollectionType, CustomCollection } from '../domain/Collection';
import NotFoundComponent from './NotFoundComponent';
import NotificationBarComponent from './NotificationBarComponent';
import EditCustomCollectionComponent from './collections/EditCustomCollectionComponent';
import UploadComponent from './UploadComponent';

type CollectionViewRouteParams = {
  identifier: string;
  type: string;
};

type CollectionPictureModalRouteParams = {
  identifier: string;
  type: string;
  hash: string;
};

type AllPicturesPictureModalRouteParams = {
  hash: string;
};

type MediaServerProps = {
  isReady: boolean,
  picturesMetadatas: PictureMetadata[];
  scrollObservable: Observable;
  picturesMetadatasMap: Map<string, PictureMetadata>;
  customCollections: CustomCollection[];
  dispatch: Dispatch<Action>;
};

function findCollectionFromTypeAndName(
  picturesMetadatas: PictureMetadata[],
  collectionType: CollectionType,
  collectionIdentifier: string,
  customCollections: CustomCollection[]) {
  switch (collectionType) {
    case CollectionType.Folder:
      const collection = extractFolderCollectionsFromPicturesMetadatas(picturesMetadatas)
        .find(currentCollection => (currentCollection.name === collectionIdentifier));
      return collection;
    case CollectionType.Custom:
      return customCollections.find(customCollection => customCollection.identifier() === collectionIdentifier);
    default:
      throw new Error(`unrecognised type ${collectionType}`);
    }
}

const withNavBar = (component: JSX.Element, navBarChild?: React.ReactNode) => (
  <React.Fragment>
    <MediaserverTopBar {...{child: navBarChild}} />
    {component}
  </React.Fragment>
);

const styles = {
  notificationsComponent: {
    position: 'fixed',
    left: '30px',
    bottom: '30px',
    zIndex: 1000,
  } as React.CSSProperties,
};

function collectionIdentifierAndTypeFromRoute(routeInfo: RouteComponentProps<CollectionViewRouteParams>) {
  const identifier = decodeURIComponent(routeInfo.match.params.identifier);
  const type = decodeURIComponent(routeInfo.match.params.type);

  return {
    identifier,
    type,
  };
}

class MediaServer extends React.Component<MediaServerProps> {
  componentWillMount() {
    this.props.dispatch(fetchPicturesMetadata());
    this.props.dispatch(fetchCollections());
  }

  renderCollectionView = (routeInfo: RouteComponentProps<CollectionViewRouteParams>) => {
    const { type, identifier } = collectionIdentifierAndTypeFromRoute(routeInfo);

    const { picturesMetadatas, customCollections } = this.props;

    const collection = findCollectionFromTypeAndName(
      picturesMetadatas,
      type as CollectionType,
      identifier,
      customCollections
    );

    if (!collection) {
      return withNavBar(<NotFoundComponent message={'no collection found'} />);
    }

    const encodedType = encodeURIComponent(routeInfo.match.params.type);
    const encodedIdentifier = encodeURIComponent(routeInfo.match.params.identifier);
    const props = {
      collection,
      picturesMetadatasMap: this.props.picturesMetadatasMap,
      routeUrl: `/collections/${encodedType}/${encodedIdentifier}`,
    };

    return withNavBar(<CollectionViewComponent {...props} />, <CollectionViewNavBarComponent {...{collection}} />);
  }

  renderEditCollectionView = (routeInfo: RouteComponentProps<CollectionViewRouteParams>) => {
    const { type, identifier } = collectionIdentifierAndTypeFromRoute(routeInfo);

    if (type !== CollectionType.Custom) {
      return <NotFoundComponent message={`can't edit type '${type}'`} />;
    }

    const { customCollections } = this.props;

    const collection = customCollections.find(customCollection => customCollection.identifier() === identifier);
    if (!collection) {
      return <NotFoundComponent message={'no collection found'} />;
    }

    const props = {
      collection
    };

    return <EditCustomCollectionComponent {...props} />;
  }

  renderAllPicturesPictureModal = (routeInfo: RouteComponentProps<AllPicturesPictureModalRouteParams>) => {
    const props = {
      picturesMetadatas: this.props.picturesMetadatas,
      hash: decodeURIComponent(routeInfo.match.params.hash),
      baseUrl: '/gallery',
    };

    return <PictureModal {...props} />;
  }

  renderCollectionPicture = (routeInfo: RouteComponentProps<CollectionPictureModalRouteParams>) => {
    const name = decodeURIComponent(routeInfo.match.params.identifier);
    const type = decodeURIComponent(routeInfo.match.params.type);
    const hash = decodeURIComponent(routeInfo.match.params.hash);

    const collection = findCollectionFromTypeAndName(
      this.props.picturesMetadatas, type as CollectionType, name, this.props.customCollections);
    if (!collection) {
      return <NotFoundComponent message={'no picture found'} />;
    }

    const picturesMetadatas = collection.fileHashes.map(hashInCollection => {
      return this.props.picturesMetadatasMap.get(hashInCollection);
    });

    const props = {
      picturesMetadatas,
      hash,
      baseUrl: `/collections/${routeInfo.match.params.type}/${routeInfo.match.params.identifier}`,
    };

    return <PictureModal {...props}/>;
  }

  renderCollectionsComponent = () => {
    return <CollectionsComponent />;
  }

  renderAllPicturesGallery = () => {
    return <AllPicturesGallery />;
  }

  render() {
    if (!this.props.isReady) {
      return <p>Loading...</p>;
    }

    return (
      <div>
        <HashRouter>
          <div>
            <Switch>
              <Route
                path="/collections/:type/:identifier/edit"
                render={(route) => withNavBar(this.renderEditCollectionView(route))}
              />
              <React.Fragment>
                <Route
                  path="/collections/:type/:identifier"
                  render={(route) => this.renderCollectionView(route)}
                />
                <Route
                  path="/collections/:type/:identifier/picture/:hash"
                  render={(route) => withNavBar(this.renderCollectionPicture(route))}
                />
              </React.Fragment>
            </Switch>
            <Route
              path="/collections"
              exact={true}
              render={() => withNavBar(this.renderCollectionsComponent(), <UploadComponent />)}
            />
            <Route
              path="/gallery"
              render={() => withNavBar(this.renderAllPicturesGallery(), <UploadComponent />)}
            />
            <Route
              path="/gallery/picture/:hash"
              render={(route) => withNavBar(this.renderAllPicturesPictureModal(route), <UploadComponent />)}
            />
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
  const { customCollections } = state.collections;

  const isReady = state.picturesMetadatas.isReady && state.collections.isReady;

  return {
    isReady,
    picturesMetadatas,
    scrollObservable,
    picturesMetadatasMap,
    customCollections,
  };
}

export default connect(mapStateToProps, null, null, {pure: false})(MediaServer);
