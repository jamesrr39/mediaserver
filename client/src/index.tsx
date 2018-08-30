import * as React from 'react';
import * as ReactDOM from 'react-dom';

import registerServiceWorker from './registerServiceWorker';
import './index.css';
import '../node_modules/font-awesome/css/font-awesome.css';

// leafletjs
import '../node_modules/leaflet/dist/leaflet.css';
// import '../node_modules/leaflet/dist/images/marker-icon.png';
// import '../node_modules/leaflet/dist/images/marker-shadow.png';

// import L from 'leaflet';
//
// import icon from '../node_modules/leaflet/dist/images/marker-icon.png';
// import iconShadow from 'leaflet/dist/images/marker-shadow.png';
//
// let DefaultIcon = L.icon({
//     iconUrl: icon,
//     shadowUrl: iconShadow
// });
//
// L.Marker.prototype.options.icon = DefaultIcon;

import { Provider } from 'react-redux';
import configureStore from './configureStore';
import MediaServer from './ui/MediaServer';

const store = configureStore();

const app = (
  <Provider store={store} >
    <MediaServer />
  </Provider>
);

ReactDOM.render(app, document.getElementById('root') as HTMLElement
);
registerServiceWorker();

// https://medium.com/@pshrmn/a-simple-react-router-v4-tutorial-7f23ff27adf
// FIXME remove link
