import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';

class Scrollbar extends Component {
	static propTypes = {
		children: PropTypes.node,
	};

	renderTrack = props => <div {...props} className="rde-track-vertical" />;

	renderView = props => <div {...props} className="rde-scrollbar-view" />;

	render() {
		return (
			<Scrollbars
				autoHide
				autoHideTimeout={700}
				autoHideDuration={160}
				renderTrackVertical={this.renderTrack}
				renderView={this.renderView}
				style={{ width: '100%', height: '100%' }}
			>
				{this.props.children}
			</Scrollbars>
		);
	}
}

export default Scrollbar;
