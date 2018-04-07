import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { BrowserRouter } from 'react-router-dom';

import { MediaServer } from './ui/MediaServer';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import { LocalhostPictureMetadataService } from './service/PictureMetadataService';
import { DebouncedObservable } from './util/Observable';

const scrollObservable = new DebouncedObservable(150);

window.addEventListener('scroll', () => scrollObservable.triggerEvent());
window.addEventListener('resize', () => scrollObservable.triggerEvent());

const props = {
  pictureMetadataService: new LocalhostPictureMetadataService(),
  scrollObservable: scrollObservable,
};

const app = (
  <BrowserRouter>
    <MediaServer {...props}  />
  </BrowserRouter>
);

ReactDOM.render(app, document.getElementById('root') as HTMLElement
);
registerServiceWorker();

// https://medium.com/@pshrmn/a-simple-react-router-v4-tutorial-7f23ff27adf
// FIXME remove link
