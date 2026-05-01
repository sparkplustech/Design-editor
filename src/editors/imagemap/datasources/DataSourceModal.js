import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input } from 'antd';
import i18n from 'i18next';

import Canvas from '../../../canvas/Canvas';
import DataSourceProperty from '../properties/DataSourceProperty';

class DataSourceModal extends Component {
	static propTypes = {
		form: PropTypes.any,
		visible: PropTypes.bool,
		dataSource: PropTypes.object,
		onOk: PropTypes.func,
		onCancel: PropTypes.func,
	};

	static defaultProps = {
		dataSource: {},
	};

	state = {
		width: 150,
		height: 150,
	};

	componentDidMount() {
		this.waitForContainerRender(this.containerRef);
	}

	componentDidUpdate(prevProps) {
		if (
			this.props.visible !== prevProps.visible ||
			JSON.stringify(this.props.dataSource) !== JSON.stringify(prevProps.dataSource)
		) {
			this.props.form.resetFields();
		}
	}

	waitForContainerRender = container => {
		setTimeout(() => {
			if (container) {
				this.setState({
					width: container.clientWidth,
					height: container.clientHeight,
				});
				return;
			}
			this.waitForContainerRender(this.containerRef);
		}, 5);
	};

	render() {
		const { form, visible, dataSource, onOk, onCancel, validateTitle, onChange } = this.props;
		const { width, height } = this.state;
		return (
			<Modal
				title="Edit data source"
				okText="Save data source"
				cancelText="Cancel"
				width={720}
				maskClosable={false}
				onOk={onOk}
				onCancel={onCancel}
				visible={visible}
			>
				<Form.Item
					label={i18n.t('common.title')}
					required
					colon={false}
					hasFeedback
					help={validateTitle.help}
					validateStatus={validateTitle.validateStatus}
				>
					<Input
						aria-label="Data source title"
						placeholder="Data source title"
						value={dataSource.title}
						onChange={e => {
							onChange(
								null,
								{ title: e.target.value },
								{ ...dataSource, title: e.target.value },
							);
						}}
					/>
				</Form.Item>
				{DataSourceProperty.render(this.canvasRef, form, { animation: dataSource })}
				<div
					ref={c => {
						this.containerRef = c;
					}}
				>
					<Canvas
						ref={c => {
							this.canvasRef = c;
						}}
						editable={false}
						width={width}
						height={height}
					/>
				</div>
			</Modal>
		);
	}
}

export default Form.create({
	onValuesChange: (props, changedValues, allValues) => {
		const { onChange } = props;
		onChange(props, changedValues, allValues);
	},
})(DataSourceModal);
