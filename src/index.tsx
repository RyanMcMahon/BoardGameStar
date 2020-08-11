import React from 'react';
import ReactDOM from 'react-dom';
import './normalize.css';
import './skeleton.css';
import './index.css';
import * as serviceWorker from './serviceWorker';
import { Router } from './components/Router/Router';

ReactDOM.render(<Router />, document.getElementById('root'));

serviceWorker.unregister();
