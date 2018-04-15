import * as React from 'react';
import { PictureMetadata } from '../domain/PictureMetadata';
import Gallery from './Gallery';
import { Observable } from '../util/Observable';
import { Route, Switch } from 'react-router';
import PictureModal from './PictureModal';
import { connect } from 'react-redux';
import { State } from '../reducers';
import { fetchPicturesMetadata } from '../actions';
import { HashRouter } from 'react-router-dom';

interface MediaServerProps {
  picturesMetadatas: PictureMetadata[];
  scrollObservable: Observable;
  // tslint:disable-next-line
  dispatch: any;
}

class MediaServer extends React.Component<MediaServerProps> {
  componentWillMount() {
    this.props.dispatch(fetchPicturesMetadata());
  }

  render() {
    return (
        <HashRouter>
          <Switch>
            <Route exact={true} path="/" component={Gallery} />
            <Route path="/picture/:hash" component={PictureModal} />
          </Switch>
        </HashRouter>
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

export default connect(mapStateToProps)(MediaServer);
