import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import MediaServer from './ui/MediaServer';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<MediaServer />, document.getElementById('root'));
registerServiceWorker();
