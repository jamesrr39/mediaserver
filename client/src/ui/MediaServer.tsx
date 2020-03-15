import * as React from 'react';
import AllPicturesGallery from './AllPicturesGallery';
import { Route, Redirect, RouteComponentProps, Switch } from 'react-router';
import MediaFileModal from './modals/MediaFileModal';
import { connect } from 'react-redux';
import { State } from '../reducers/rootReducer';
import { fetchPicturesMetadata, fetchAllPeople } from '../actions/mediaFileActions';
import { HashRouter } from 'react-router-dom';
import { Action, Dispatch } from 'redux';
import MediaserverTopBar from './MediaserverTopBar';
import { fetchCollections } from '../collectionsActions';
import CollectionsComponent from './collections/CollectionsListingComponent';
import CollectionViewComponent, { CollectionViewNavBarComponent } from './collections/CollectionViewComponent';
import { extractFolderCollectionsFrommediaFiles, CollectionType, CustomCollection } from '../domain/Collection';
import NotFoundComponent from './NotFoundComponent';
import NotificationBarComponent from './NotificationBarComponent';
import EditCustomCollectionComponent from './collections/EditCustomCollectionComponent';
import UploadComponent from './upload/UploadComponent';
import { MediaFile } from '../domain/MediaFile';
import UploadProgressComponent from './upload/UploadProgressComponent';
import { gallerySortingFunc } from './gallery/Gallery';
import { filterFromJson } from '../domain/Filter';
import { LoadingStatus } from '../domain/LoadingStatus';
import MediafilesMap from './MediafilesMap';

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
  filterJson?: string;
};

type MediaServerProps = {
  loadingStatus: LoadingStatus,
  mediaFiles: MediaFile[];
  mediaFilesMap: Map<string, MediaFile>;
  customCollections: CustomCollection[];
  dispatch: Dispatch<Action>;
};

function findCollectionFromTypeAndName(
  mediaFiles: MediaFile[],
  collectionType: CollectionType,
  collectionIdentifier: string,
  customCollections: CustomCollection[]) {
  switch (collectionType) {
    case CollectionType.Folder:
      const collection = extractFolderCollectionsFrommediaFiles(mediaFiles)
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
    position: 'fixed' as 'fixed',
    left: '30px',
    bottom: '30px',
    zIndex: 1001,
  },
  uploadProgressComponent: { 
    position: 'fixed' as 'fixed',
    right: '30px',
    bottom: '30px',
    zIndex: 1000,
  }
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
    const { dispatch } = this.props;
    fetchPicturesMetadata()(dispatch);
    fetchCollections()(dispatch);
    fetchAllPeople()(dispatch);
  }

  renderCollectionView = (routeInfo: RouteComponentProps<CollectionViewRouteParams>) => {
    const { type, identifier } = collectionIdentifierAndTypeFromRoute(routeInfo);

    const { mediaFiles, customCollections } = this.props;

    const collection = findCollectionFromTypeAndName(
      mediaFiles,
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
      mediaFilesMap: this.props.mediaFilesMap,
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
    const filter = filterFromJson(routeInfo.match.params.filterJson || '{}');
    const mediaFiles = this.props.mediaFiles.filter(mediaFile => filter.filter(mediaFile));
    mediaFiles.sort(gallerySortingFunc);
    
    const props = {
      mediaFiles,
      hash: decodeURIComponent(routeInfo.match.params.hash),
      baseUrl: '/gallery',
    };

    return <MediaFileModal {...props} />;
  }

  renderCollectionPicture = (routeInfo: RouteComponentProps<CollectionPictureModalRouteParams>) => {
    const name = decodeURIComponent(routeInfo.match.params.identifier);
    const type = decodeURIComponent(routeInfo.match.params.type);
    const hash = decodeURIComponent(routeInfo.match.params.hash);

    const collection = findCollectionFromTypeAndName(
      this.props.mediaFiles, type as CollectionType, name, this.props.customCollections);
    if (!collection) {
      return <NotFoundComponent message={'no picture found'} />;
    }

    const mediaFiles = collection.fileHashes.map(hashInCollection => {
      const mediaFile = this.props.mediaFilesMap.get(hashInCollection);
      if (!mediaFile) {
        throw new Error(`unexpected error: could not find picture metadata for hash ${hashInCollection}`);
      }

      return mediaFile;
    });

    const props = {
      mediaFiles,
      hash,
      baseUrl: `/collections/${routeInfo.match.params.type}/${routeInfo.match.params.identifier}`,
    };

    return <MediaFileModal {...props}/>;
  }

  renderCollectionsComponent = () =>  <CollectionsComponent />;

  renderAllPicturesGallery = () =>  <AllPicturesGallery />;

  renderMap = () => {
    const props = {
      mediaFileUrlBase: '/gallery/detail',
    };

    return <MediafilesMap {...props} />;
  }

  render() {
    if (this.props.loadingStatus === LoadingStatus.IN_PROGRESS) {
      return <p>Loading...</p>;
    }

    if (this.props.loadingStatus === LoadingStatus.FAILED) {
      return <p>Error: failed to load</p>;
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
                  path="/collections/:type/:identifier/detail/:hash"
                  render={(route) => withNavBar(this.renderCollectionPicture(route))}
                />
              </React.Fragment>
            </Switch>
            <Route
              path="/collections"
              exact={true}
              render={() => withNavBar(this.renderCollectionsComponent(), <UploadComponent />)}
            />
            <Route path="/map" render={() => withNavBar(this.renderMap(), <UploadComponent />)} />
            <Route
              path="/gallery"
              render={() => withNavBar(this.renderAllPicturesGallery(), <UploadComponent />)}
            />
            <Route
              path="/gallery/detail/:hash"
              render={(route) => withNavBar(this.renderAllPicturesPictureModal(route), <UploadComponent />)}
            />
            <Route path="/" exact={true} render={() => (<Redirect to="/gallery" />)} />
            <div style={styles.notificationsComponent}>
              <NotificationBarComponent />
            </div>
            <div style={styles.uploadProgressComponent}>
              <UploadProgressComponent />
            </div>
          </div>
        </HashRouter>
      </div>
    );
  }
}

function getLoadingStatus(state: State) {
  const {mediaFilesReducer, collectionsReducer} = state;

  if (mediaFilesReducer.loadingStatus === LoadingStatus.FAILED || 
    collectionsReducer.loadingStatus === LoadingStatus.FAILED) {
    return LoadingStatus.FAILED;
  }
  
  if (mediaFilesReducer.loadingStatus === LoadingStatus.IN_PROGRESS || 
    collectionsReducer.loadingStatus === LoadingStatus.IN_PROGRESS) {
    return LoadingStatus.IN_PROGRESS;
  }

  return LoadingStatus.SUCCESSFUL;
}

function mapStateToProps(state: State) {
  const { mediaFiles, mediaFilesMap: mediaFilesMap } = state.mediaFilesReducer;
  const { customCollections } = state.collectionsReducer;

  const loadingStatus = getLoadingStatus(state);

  return {
    loadingStatus,
    mediaFiles,
    mediaFilesMap,
    customCollections,
  };
}

export default connect(
  mapStateToProps,
  dispatch => ({dispatch}),
)(MediaServer);
