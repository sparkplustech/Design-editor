import React from 'react';
import ReactDom from 'react-dom';
import './canvas/fabricCompat';
import App from './App';
import { unregister } from './serviceWorker';
import { i18nClient } from './i18n';

const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

const render = Component => {
	const rootElement = document.getElementById('root');
	ReactDom.render(<Component />, rootElement);
};

i18nClient();

render(App);

unregister();

if (module.hot) {
	module.hot.accept('./App', () => {
		render(App);
	});
}
