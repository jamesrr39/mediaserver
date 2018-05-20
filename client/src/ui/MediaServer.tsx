import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';
import Gallery from './Gallery';
import { Observable } from '../util/Observable';
import { Route, Switch } from 'react-router';
import PictureModal from './PictureModal';
import { connect, Dispatch } from 'react-redux';
import { State } from '../reducers';
import { fetchPicturesMetadata } from '../actions';
import { HashRouter } from 'react-router-dom';
import { Action } from 'redux';

interface MediaServerProps {
  picturesMetadatas: PictureMetadata[];
  scrollObservable: Observable;
  dispatch: Dispatch<Action>;
}

class MediaServer extends React.Component<MediaServerProps> {
  componentWillMount() {
    this.props.dispatch(fetchPicturesMetadata());
    // const cb = () => {
    //   this.props.dispatch(notify({level: 'info', text: 'aaaa'}));
    // };
    // setInterval(cb, 3500);
  }

  render() {
    return (
      <div>
        <Gallery />
        <HashRouter>
          <Switch>
            <Route path="/picture/:hash" component={PictureModal} />
          </Switch>
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
