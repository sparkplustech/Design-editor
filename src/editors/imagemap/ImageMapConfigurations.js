import React, { Component } from 'react';
import PropTypes from 'prop-types';

import NodeProperties from './properties/NodeProperties';

class ImageMapConfigurations extends Component {
	static propTypes = {
		canvasRef: PropTypes.any,
		selectedItem: PropTypes.object,
		onChange: PropTypes.func,
		toolbarClass: PropTypes.string,
	};

	static defaultProps = {
		toolbarClass: '',
	};

	render() {
		const { onChange, selectedItem, canvasRef, toolbarClass } = this.props;

		const inspectorCollapsed = toolbarClass === 'minimize';
		return (
			<div className={`rde-editor-configurations ${toolbarClass}`} aria-hidden={inspectorCollapsed}>
				{inspectorCollapsed ? null : (
					<NodeProperties onChange={onChange} selectedItem={selectedItem} canvasRef={canvasRef} />
				)}
			</div>
		);
	}
}

export default ImageMapConfigurations;
