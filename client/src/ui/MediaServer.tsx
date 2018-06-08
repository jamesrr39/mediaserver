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
import CollectionsComponent from './collections/CollectionsListingComponent';
import CollectionViewComponent from './collections/CollectionViewComponent';
import { extractFolderCollectionsFromPicturesMetadatas } from '../domain/Collection';
import NotFoundComponent from './NotFoundComponent';

type CollectionViewRouteParams = {
  name: string;
  type: string;
};

interface MediaServerProps {
  picturesMetadatas: PictureMetadata[];
  scrollObservable: Observable;
  picturesMetadatasMap: Map<string, PictureMetadata>;
  dispatch: Dispatch<Action>;
}

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
          return <NotFoundComponent message={'no collection found'} />;
        }
        const props = {
          collection,
          picturesMetadatasMap: this.props.picturesMetadatasMap,
        };
        return <CollectionViewComponent {...props} />;
      default:
        return <NotFoundComponent message={'type not found'} />;
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
  const { picturesMetadatas, scrollObservable, picturesMetadatasMap } = state.picturesMetadatas;

  return {
    picturesMetadatas,
    scrollObservable,
    picturesMetadatasMap,
  };
}

export default connect(mapStateToProps, null, null, {pure: false})(MediaServer);
