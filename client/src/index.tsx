import * as React from 'react';
import * as ReactDOM from 'react-dom';

import registerServiceWorker from './registerServiceWorker';
import './index.css';
import '../node_modules/font-awesome/css/font-awesome.css';

import '../node_modules/leaflet/dist/leaflet.css';
// const facss = require('../../node_modules/font-awesome/css/font-awesome.css');
import '../node_modules/font-awesome/css/font-awesome.css';

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
