import React from 'react';
import ReactDOM from 'react-dom';
import './normalize.css';
import './skeleton.css';
import './index.css';
import * as serviceWorker from './serviceWorker';
import { Router } from './components/Router/Router';

// ReactDOM.render(<App />, document.getElementById("root"));
ReactDOM.render(<Router />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
