import * as React from 'react';
import * as ReactDOM from 'react-dom';
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

ReactDOM.render(
  <MediaServer {...props}  />,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
