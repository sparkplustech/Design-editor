import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Layout, Spin } from 'antd';

interface IProps {
	title?: React.ReactNode;
	leftSider?: React.ReactNode;
	content?: React.ReactNode;
	rightSider?: React.ReactNode;
	className?: string;
	loading?: boolean;
	previewModal?: React.ReactNode;
}

class Content extends Component<IProps> {
	static propTypes = {
		title: PropTypes.any,
		leftSider: PropTypes.any,
		content: PropTypes.any,
		rightSider: PropTypes.any,
		className: PropTypes.string,
		loading: PropTypes.bool,
		previewModal: PropTypes.any,
	};

	static defaultProps = {
		className: 'rde-content-layout-main',
		loading: false,
	};

	render() {
		const { title, leftSider, content, rightSider, className, loading, children, previewModal } = this.props;
		return (
			<Spin spinning={loading}>
				<Layout className="rde-content-layout">
					{title}
					<Layout
						style={{
							overflowY: 'auto',
							overflowX: 'hidden',
							minHeight: `calc(100vh - ${title ? 60 : 60}px)`,
							height: `calc(100vh - ${title ? 98 : 60}px)`,
						}}
						className={className}
					>
						{leftSider}
						{content || children}
						{rightSider}
						{previewModal}
					</Layout>
				</Layout>
			</Spin>
		);
	}
}

export default Content;
