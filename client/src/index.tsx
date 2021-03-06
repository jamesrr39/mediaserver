import * as React from 'react';
import * as ReactDOM from 'react-dom';

import registerServiceWorker from './registerServiceWorker';
import './index.css';
import '../node_modules/font-awesome/css/font-awesome.css';

import '../node_modules/leaflet/dist/leaflet.css';
import '../node_modules/font-awesome/css/font-awesome.css';

import { Provider } from 'react-redux';
import configureStore from './configureStore';
import App from './ui/App';

const store = configureStore(window);

const app = (
  <Provider store={store} >
    <App />
  </Provider>
);

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error(`couldn't find root element`);
}

ReactDOM.render(app, rootEl);
registerServiceWorker();

// https://medium.com/@pshrmn/a-simple-react-router-v4-tutorial-7f23ff27adf
// FIXME remove link
