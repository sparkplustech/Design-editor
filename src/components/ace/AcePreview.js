import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { buildSandboxedHtml, emptyElement } from '../../utils/sandboxedHtml';

class AcePreview extends Component {
	static propTypes = {
		html: PropTypes.string,
		css: PropTypes.string,
		js: PropTypes.string,
	};

	static defaultProps = {
		html: '',
		css: '',
		js: '',
	};

	componentDidMount() {
		const { html, css, js } = this.props;
		this.iframeRender(html, css, js);
	}

	componentDidUpdate(prevProps) {
		if (this.container) {
			const { html, css, js } = this.props;
			if (html !== prevProps.html || css !== prevProps.css || js !== prevProps.js) {
				this.iframeRender(html, css, js);
			}
		}
	}

	iframeRender = (html, css, js) => {
		emptyElement(this.container);
		const iframe = document.createElement('iframe');
		iframe.title = 'Code preview';
		iframe.width = '100%';
		iframe.height = '200px';
		iframe.setAttribute('sandbox', 'allow-scripts');
		iframe.srcdoc = buildSandboxedHtml(html, css, js);
		this.container.appendChild(iframe);
	};

	render() {
		return (
			<div
				ref={(c) => {
					this.container = c;
				}}
				id="code-preview"
				style={{ width: '100%', height: 200 }}
			/>
		);
	}
}

export default AcePreview;
