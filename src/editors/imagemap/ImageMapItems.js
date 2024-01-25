import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collapse, notification, Input, message } from 'antd';
import classnames from 'classnames';
import i18n from 'i18next';
import { FileTextFilled, AntDesignOutlined, LayoutOutlined, ProfileOutlined, TagOutlined } from '@ant-design/icons';
import { Flex } from '../../components/flex';
import Icon from '../../components/icon/Icon';
import Scrollbar from '../../components/common/Scrollbar';
import CommonButton from '../../components/common/CommonButton';
import Templates from '../../components/templates/Templates';
import Design from '../../components/design/Design';
import Attributes from '../../components/attributes/Attributes';
import { SVGModal } from '../../components/common';
import { uuid } from 'uuidv4';
import { FlowSettings } from '../flow';

notification.config({
	top: 80,
	duration: 2,
});

class ImageMapItems extends Component {
	static propTypes = {
		canvasRef: PropTypes.any,
		descriptors: PropTypes.object,
	};

	state = {
		activeKey: [],
		collapse: false,
		textSearch: '',
		descriptors: {},
		filteredDescriptors: [],
		svgModalVisible: false,
		activeSection: 'design',
		item: null,
	};

	componentDidMount() {
		const { canvasRef } = this.props;
		this.waitForCanvasRender(canvasRef);
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		if (JSON.stringify(this.props.descriptors) !== JSON.stringify(nextProps.descriptors)) {
			const descriptors = Object.keys(nextProps.descriptors).reduce((prev, key) => {
				return prev.concat(nextProps.descriptors[key]);
			}, []);
			this.setState({
				descriptors,
			});
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (JSON.stringify(this.state.descriptors) !== JSON.stringify(nextState.descriptors)) {
			return true;
		} else if (JSON.stringify(this.state.filteredDescriptors) !== JSON.stringify(nextState.filteredDescriptors)) {
			return true;
		} else if (this.state.textSearch !== nextState.textSearch) {
			return true;
		} else if (JSON.stringify(this.state.activeKey) !== JSON.stringify(nextState.activeKey)) {
			return true;
		} else if (this.state.collapse !== nextState.collapse) {
			return true;
		} else if (this.state.svgModalVisible !== nextState.svgModalVisible) {
			return true;
		} else if (this.state.activeSection !== nextState.activeSection) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		const { canvasRef } = this.props;
		this.detachEventListener(canvasRef);
	}

	waitForCanvasRender = canvas => {
		setTimeout(() => {
			if (canvas) {
				this.attachEventListener(canvas);
				return;
			}
			const { canvasRef } = this.props;
			this.waitForCanvasRender(canvasRef);
		}, 5);
	};

	attachEventListener = canvas => {
		canvas.canvas.wrapperEl.addEventListener('dragenter', this.events.onDragEnter, false);
		canvas.canvas.wrapperEl.addEventListener('dragover', this.events.onDragOver, false);
		canvas.canvas.wrapperEl.addEventListener('dragleave', this.events.onDragLeave, false);
		canvas.canvas.wrapperEl.addEventListener('drop', this.events.onDrop, false);
	};

	detachEventListener = canvas => {
		canvas.canvas.wrapperEl.removeEventListener('dragenter', this.events.onDragEnter);
		canvas.canvas.wrapperEl.removeEventListener('dragover', this.events.onDragOver);
		canvas.canvas.wrapperEl.removeEventListener('dragleave', this.events.onDragLeave);
		canvas.canvas.wrapperEl.removeEventListener('drop', this.events.onDrop);
	};

	/* eslint-disable react/sort-comp, react/prop-types */
	handlers = {
		onAddItem: (item, centered) => {
			const { canvasRef } = this.props;
			if (canvasRef.handler.interactionMode === 'polygon') {
				message.info('Already drawing');
				return;
			}
			const id = uuid();
			const option = Object.assign({}, item.option, { id });
			if (item.option.superType === 'svg' && item.type === 'default') {
				this.handlers.onSVGModalVisible(item.option);
				return;
			}
			canvasRef.handler.add(option, centered);
		},
		onAddSVG: (option, centered) => {
			const { canvasRef } = this.props;
			canvasRef.handler.add({ ...option, type: 'svg', superType: 'svg', id: uuid(), name: 'New SVG' }, centered);
			this.handlers.onSVGModalVisible();
		},
		onDrawingItem: item => {
			const { canvasRef } = this.props;
			if (canvasRef.handler.interactionMode === 'polygon') {
				message.info('Already drawing');
				return;
			}
			if (item.option.type === 'line') {
				canvasRef.handler.drawingHandler.line.init();
			} else if (item.option.type === 'arrow') {
				canvasRef.handler.drawingHandler.arrow.init();
			} else {
				canvasRef.handler.drawingHandler.polygon.init();
			}
		},
		onChangeActiveKey: activeKey => {
			this.setState({
				activeKey,
			});
		},
		onCollapse: () => {
			this.setState({
				collapse: !this.state.collapse,
			});
		},
		onSearchNode: e => {
			const filteredDescriptors = this.handlers
				.transformList()
				.filter(descriptor => descriptor.name.toLowerCase().includes(e.target.value.toLowerCase()));
			this.setState({
				textSearch: e.target.value,
				filteredDescriptors,
			});
		},
		transformList: () => {
			return Object.values(this.props.descriptors).reduce((prev, curr) => prev.concat(curr), []);
		},
		onSVGModalVisible: () => {
			this.setState(prevState => {
				return {
					svgModalVisible: !prevState.svgModalVisible,
				};
			});
		},
		onDesignClick: () => {
			this.setState({ activeSection: 'design' });
			this.setState({ collapse: false });
		},
		onTemplateClick: () => {
			this.setState({ activeSection: 'template' });
			this.setState({ collapse: false });
		},
		onComponentsClick: () => {
			this.setState({ activeSection: 'components' });
			this.setState({ collapse: false });
		},
		onAttributeClick: () => {
			this.setState({ activeSection: 'attribute' });
			this.setState({ collapse: false });
		},
	};

	events = {
		onDragStart: (e, item) => {
			this.item = item;
			const { target } = e;
			target.classList.add('dragging');
		},
		onDragOver: e => {
			if (e.preventDefault) {
				e.preventDefault();
			}
			e.dataTransfer.dropEffect = 'copy';
			return false;
		},
		onDragEnter: e => {
			const { target } = e;
			target.classList.add('over');
		},
		onDragLeave: e => {
			const { target } = e;
			target.classList.remove('over');
		},
		onDrop: e => {
			e = e || window.event;
			if (e.preventDefault) {
				e.preventDefault();
			}
			if (e.stopPropagation) {
				e.stopPropagation();
			}
			const { layerX, layerY } = e;
			const dt = e.dataTransfer;
			if (dt.types.length && dt.types[0] === 'Files') {
				const { files } = dt;
				Array.from(files).forEach(file => {
					file.uid = uuid();
					const { type } = file;
					if (type === 'image/png' || type === 'image/jpeg' || type === 'image/jpg') {
						const item = {
							option: {
								type: 'image',
								file,
								left: layerX,
								top: layerY,
							},
						};
						this.handlers.onAddItem(item, false);
					} else {
						notification.warn({
							message: 'Not supported file type',
						});
					}
				});
				return false;
			}
			const option = Object.assign({}, this.item.option, { left: layerX, top: layerY });
			const newItem = Object.assign({}, this.item, { option });
			this.handlers.onAddItem(newItem, false);
			return false;
		},
		onDragEnd: e => {
			this.item = null;
			e.target.classList.remove('dragging');
		},
	};

	// renderItems = items => (
	// 	<Flex flexWrap="wrap" flexDirection="row"  style={{ width: '100%',padding:"40px", gap:'10px'	}}>
	// 		{items.map(item => this.renderItem(item))}
	// 	</Flex>
	// );

	renderItem = (item, centered) =>
		item.type === 'drawing' ? (
			<div
				key={item.name}
				draggable
				onClick={e => this.handlers.onDrawingItem(item)}
				className="rde-editor-items-item"
				style={{
					justifyContent: 'center',
					alignItems: 'center',
					display: 'flex',
					flexDirection: 'column',
					border: '1px solid #e8e8e8',
					width: '80px',
					height: '80px',
				}}
			>
				<span className="rde-editor-items-item-icon">
					<Icon name={item.icon.name} prefix={item.icon.prefix} style={item.icon.style} />
				</span>
				<div className="rde-editor-items-item-text">{item.name}</div>
			</div>
		) : (
			<div
				key={item.name}
				draggable
				onClick={e => this.handlers.onAddItem(item, centered)}
				onDragStart={e => this.events.onDragStart(e, item)}
				onDragEnd={e => this.events.onDragEnd(e, item)}
				className="rde-editor-items-item"
				style={{
					justifyContent: 'center',
					alignItems: 'center',
					display: 'flex',
					flexDirection: 'column',
					border: '1px solid #e8e8e8',
					width: '80px',
					height: '80px',
				}}
			>
				<span className="rde-editor-items-item-icon">
					<Icon name={item.icon.name} prefix={item.icon.prefix} style={item.icon.style} />
				</span>
				<div className="rde-editor-items-item-text">{item.name}</div>
			</div>
		);

	render() {
		const { descriptors } = this.props;
		const {
			collapse,
			textSearch,
			filteredDescriptors,
			activeKey,
			svgModalVisible,
			svgOption,
			activeSection,
		} = this.state;
		const className = classnames('rde-editor-items', {
			minimize: collapse,
		});
		return (
			<div className={className}>
				<Flex flex="1" flexDirection="row" style={{ height: '100%' }}>
					<Flex
						justifyContent="top"
						flexDirection="column"
						alignItems="center"
						style={{ height: '100%', padding: '5px 0px', background: '#e7e8ea' }}
					>
						<CommonButton
							icon={collapse ? 'angle-double-right' : 'angle-double-left'}
							shape="circle"
							className="rde-action-btn"
							style={{ margin: '0 4px' }}
							onClick={this.handlers.onCollapse}
						/>
						<Flex
							flexDirection="column"
							className={`${
								activeSection === 'design' ? 'leftbarmenu leftbarmenu-active' : 'leftbarmenu'
							}`}
						>
							<AntDesignOutlined
								onClick={() => this.handlers.onDesignClick()}
								style={{ fontSize: '32px' }}
							/>{' '}
							<span onClick={() => this.handlers.onDesignClick()}>Designs</span>{' '}
						</Flex>
						<Flex
							flexDirection="column"
							className={`${
								activeSection === 'template' ? 'leftbarmenu leftbarmenu-active' : 'leftbarmenu'
							}`}
						>
							<ProfileOutlined
								onClick={() => this.handlers.onTemplateClick()}
								style={{ fontSize: '32px' }}
							/>{' '}
							<span onClick={() => this.handlers.onTemplateClick()}>Templates</span>{' '}
						</Flex>
						<Flex
							flexDirection="column"
							className={`${
								activeSection === 'components' ? 'leftbarmenu leftbarmenu-active' : 'leftbarmenu'
							}`}
						>
							<LayoutOutlined
								onClick={() => this.handlers.onComponentsClick()}
								style={{ fontSize: '32px' }}
							/>{' '}
							<span onClick={() => this.handlers.onComponentsClick()}>Components</span>{' '}
						</Flex>
						<Flex
							flexDirection="column"
							className={`${
								activeSection === 'attribute' ? 'leftbarmenu leftbarmenu-active' : 'leftbarmenu'
							}`}
						>
							<TagOutlined
								onClick={() => this.handlers.onAttributeClick()}
								style={{ fontSize: '32px' }}
							/>{' '}
							<span onClick={() => this.handlers.onAttributeClick()}>Attributes</span>{' '}
						</Flex>
					</Flex>

					<Flex flex="1" flexDirection="column" style={{ overflowY: 'hidden', width: '400px' }}>
						{/* {collapse ? null : (
							<Input
								style={{ margin: '8px' }}
								placeholder={i18n.t('action.search-list')}
								onChange={this.handlers.onSearchNode}
								value={textSearch}
								allowClear
							/>
						)} */}
						<Scrollbar>
							{activeSection === 'components' && (
								<Flex flex="1" style={{ overflowY: 'hidden' }}>
									{(textSearch.length && this.renderItems(filteredDescriptors)) || (
										<Flex
											flexWrap="wrap"
											flexDirection="row"
											style={{
												width: '100%',
												padding: '15px 10px 10px',
												gap: '10px',
												justifyContent: 'space-evenly',
											}}
											justifyContent="center"
										>
											{this.handlers.transformList().map(item => this.renderItem(item))}
										</Flex>
									)}
								</Flex>
							)}
							{activeSection === 'design' && (
								<Flex flex="1" style={{ overflowY: 'hidden' }}>
									<Design/>
								</Flex>
							)}

							{activeSection === 'template' && (
								<Flex flex="1" style={{ overflowY: 'hidden' }}>
									<Templates />
								</Flex>
							)}
							{activeSection === 'attribute' && (
								<div>
									<Attributes canvasRef={this.props.canvasRef} />
								</div>
							)}
						</Scrollbar>
					</Flex>
				</Flex>
				<SVGModal
					visible={svgModalVisible}
					onOk={this.handlers.onAddSVG}
					onCancel={this.handlers.onSVGModalVisible}
					option={svgOption}
				/>
			</div>
		);
	}
}

export default ImageMapItems;
