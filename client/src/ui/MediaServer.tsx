import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';
import Gallery from './Gallery';
import { Observable } from '../util/Observable';
import { Route } from 'react-router';
import PictureModal from './PictureModal';
import { connect, Dispatch } from 'react-redux';
import { State } from '../reducers';
import { fetchPicturesMetadata } from '../actions';
import { HashRouter } from 'react-router-dom';
import { Action } from 'redux';
import MediaserverTopBar from './MediaserverTopBar';

interface MediaServerProps {
  picturesMetadatas: PictureMetadata[];
  scrollObservable: Observable;
  dispatch: Dispatch<Action>;
}

class MediaServer extends React.Component<MediaServerProps> {
  componentWillMount() {
    this.props.dispatch(fetchPicturesMetadata());
  }

  render() {
    return (
      <div>
        <HashRouter>
          <div>
            <MediaserverTopBar />
            <Route path="/" component={Gallery} />
            <Route path="/picture/:hash" component={PictureModal} />
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
