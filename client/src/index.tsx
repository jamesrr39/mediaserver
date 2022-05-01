import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

import registerServiceWorker from './registerServiceWorker';

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

ReactDOM.createRoot(rootEl).render(app);
registerServiceWorker();

// https://medium.com/@pshrmn/a-simple-react-router-v4-tutorial-7f23ff27adf
// FIXME remove link
