import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { notification, Input, message } from 'antd';
import classnames from 'classnames';
import {
	AppstoreOutlined,
	LayoutOutlined,
	ProfileOutlined,
	TagOutlined,
	PictureOutlined,
} from '@ant-design/icons';
import { Flex } from '../../components/flex';
import Icon from '../../components/icon/Icon';
import Scrollbar from '../../components/common/Scrollbar';
import CommonButton from '../../components/common/CommonButton';
import Templates from '../../components/templates/Templates';
import Design from '../../components/design/Design';
import BadgeBackground from '../../components/badge-background/BadgeBackground';
import BadgeDesign from '../../components/badge-design/BadgeDesign';
import Attributes from '../../components/attributes/Attributes';
import { SVGModal } from '../../components/common';
import { v4 as uuid } from '../../utils/uuid';
import { FlowSettings } from '../flow';
import { fetchSvgText, sanitizeSvgText } from '../../utils/svgSanitizer';
import { parseEditorSession } from '../../utils/editorSession';

notification.config({
	top: 80,
	duration: 2,
});

class ImageMapItems extends Component {
	static propTypes = {
		canvasRef: PropTypes.any,
		getCanvasRef: PropTypes.func,
		descriptors: PropTypes.object,
		onPageSizeChange: PropTypes.any,
		onCanvasChange: PropTypes.any,
		mainLoader: PropTypes.func,
		onFocusCanvas: PropTypes.func,
		onApplyCanvasAsset: PropTypes.func,
	};

	state = {
		collapse: false,
		textSearch: '',
		descriptors: {},
		filteredDescriptors: [],
		svgModalVisible: false,
		activeSection: 'design',
		item: null,
		editorSession: parseEditorSession(),
	};

	componentDidMount() {
		this.isItemsMounted = true;
		this.waitForCanvasRender(this.getCanvasRef());
		const editorSession = parseEditorSession();

		this.setState({ editorSession });

		if (editorSession.isAdminPath) {
			this.setState({ activeSection: 'template' });
		} else if (editorSession.isCertificatePath) {
			this.setState({ activeSection: 'components' });
		}
	}

	componentDidUpdate(prevProps) {
		const currentCanvasRef = this.getCanvasRef();
		if (prevProps.canvasRef !== this.props.canvasRef || (this.attachedCanvasRef && currentCanvasRef && this.attachedCanvasRef !== currentCanvasRef)) {
			this.detachEventListener(this.attachedCanvasRef);
			this.waitForCanvasRender(currentCanvasRef);
		}
		if (JSON.stringify(prevProps.descriptors) !== JSON.stringify(this.props.descriptors)) {
			const descriptors = Object.keys(this.props.descriptors).reduce((prev, key) => {
				return prev.concat(this.props.descriptors[key]);
			}, []);
			this.setState({
				descriptors,
			});
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (JSON.stringify(this.props.descriptors) !== JSON.stringify(nextProps.descriptors)) {
			return true;
		} else if (JSON.stringify(this.state.descriptors) !== JSON.stringify(nextState.descriptors)) {
			return true;
		} else if (JSON.stringify(this.state.filteredDescriptors) !== JSON.stringify(nextState.filteredDescriptors)) {
			return true;
		} else if (this.state.textSearch !== nextState.textSearch) {
			return true;
		} else if (this.state.collapse !== nextState.collapse) {
			return true;
		} else if (this.state.svgModalVisible !== nextState.svgModalVisible) {
			return true;
		} else if (this.state.svgOption !== nextState.svgOption) {
			return true;
		} else if (this.state.activeSection !== nextState.activeSection) {
			return true;
		} else if (JSON.stringify(this.state.editorSession) !== JSON.stringify(nextState.editorSession)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		this.isItemsMounted = false;
		clearTimeout(this.waitForCanvasTimer);
		this.detachEventListener(this.attachedCanvasRef || this.getCanvasRef());
	}

	getCanvasRef = () => this.props.canvasRef || (this.props.getCanvasRef && this.props.getCanvasRef());

	waitForCanvasRender = canvas => {
		clearTimeout(this.waitForCanvasTimer);
		this.waitForCanvasTimer = setTimeout(() => {
			if (!this.isItemsMounted) {
				return;
			}
			const canvasRef = canvas || this.getCanvasRef();
			if (canvasRef?.handler) {
				this.attachEventListener(canvasRef);
				return;
			}
			this.waitForCanvasRender();
		}, 5);
	};

	attachEventListener = canvas => {
		if (!canvas?.canvas?.wrapperEl) {
			return;
		}
		if (this.attachedCanvasRef === canvas) {
			return;
		}
		this.detachEventListener(this.attachedCanvasRef);
		canvas.canvas.wrapperEl.addEventListener('dragenter', this.events.onDragEnter, false);
		canvas.canvas.wrapperEl.addEventListener('dragover', this.events.onDragOver, false);
		canvas.canvas.wrapperEl.addEventListener('dragleave', this.events.onDragLeave, false);
		canvas.canvas.wrapperEl.addEventListener('drop', this.events.onDrop, false);
		this.attachedCanvasRef = canvas;
	};

	detachEventListener = canvas => {
		if (!canvas?.canvas?.wrapperEl) {
			return;
		}
		canvas.canvas.wrapperEl.removeEventListener('dragenter', this.events.onDragEnter);
		canvas.canvas.wrapperEl.removeEventListener('dragover', this.events.onDragOver);
		canvas.canvas.wrapperEl.removeEventListener('dragleave', this.events.onDragLeave);
		canvas.canvas.wrapperEl.removeEventListener('drop', this.events.onDrop);
		if (this.attachedCanvasRef === canvas) {
			this.attachedCanvasRef = null;
		}
	};

	/* eslint-disable react/sort-comp, react/prop-types */
	handlers = {
		onAddItem: async (item, centered) => {
			const canvasRef = this.getCanvasRef();
			if (!canvasRef?.handler) {
				message.error('Canvas is still loading. Try again in a moment.');
				return;
			}
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
			if (item.option.superType === 'svg' && item.type === 'component') {
				try {
					const svg = await fetchSvgText(item.svgUrl);
					canvasRef.handler.add(
						{
							...item.option,
							loadType: 'svg',
							svg,
							type: 'svg',
							superType: 'svg',
							id: uuid(),
							name: 'New SVG',
						},
						centered,
					);
					this.props.onFocusCanvas?.();
				} catch (error) {
					message.error(error.message || 'Unable to load SVG.');
				}
				return;
			}
			canvasRef.handler.add(option, centered);
			this.props.onFocusCanvas?.();
		},
		getDropPosition: event => {
			const wrapperEl = this.getCanvasRef()?.canvas?.wrapperEl;
			if (!wrapperEl) {
				return { left: event.layerX, top: event.layerY };
			}
			const bounds = wrapperEl.getBoundingClientRect();
			return {
				left: event.clientX - bounds.left,
				top: event.clientY - bounds.top,
			};
		},
		onAddSVG: (option, centered) => {
			const canvasRef = this.getCanvasRef();
			if (!canvasRef?.handler) {
				message.error('Canvas is still loading. Try again in a moment.');
				return;
			}
			try {
				const svg = sanitizeSvgText(option.svg);
				canvasRef.handler.add({ ...option, loadType: 'svg', svg, type: 'svg', superType: 'svg', id: uuid(), name: 'New SVG' }, centered);
				this.handlers.onSVGModalVisible();
				this.props.onFocusCanvas?.();
			} catch (error) {
				message.error(error.message || 'Unable to add SVG.');
			}
		},
		onDrawingItem: item => {
			const canvasRef = this.getCanvasRef();
			if (!canvasRef?.handler) {
				message.error('Canvas is still loading. Try again in a moment.');
				return;
			}
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
			this.props.onFocusCanvas?.();
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
		onSVGModalVisible: svgOption => {
			this.setState(prevState => {
				return {
					svgModalVisible: !prevState.svgModalVisible,
					svgOption: svgOption || null,
				};
			});
		},
		onSectionChange: section => {
			this.setState({ activeSection: section });
			this.setState({ collapse: false });
			this.props.onFocusCanvas?.();
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
			const { left, top } = this.handlers.getDropPosition(e);
			const dt = e.dataTransfer;
			if (!dt) {
				return false;
			}
			const types = Array.from(dt.types || []);
			if (types.includes('Files')) {
				const { files } = dt;
				Array.from(files).forEach(file => {
					file.uid = uuid();
					const { type } = file;
					if (type === 'image/png' || type === 'image/jpeg' || type === 'image/jpg') {
						const item = {
							option: {
								type: 'image',
								file,
								left,
								top,
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
			if (!this.item?.option) {
				return false;
			}
			const option = Object.assign({}, this.item.option, { left, top });
			const newItem = Object.assign({}, this.item, { option });
			this.handlers.onAddItem(newItem, false);
			return false;
		},
		onDragEnd: e => {
			this.item = null;
			e.target.classList.remove('dragging');
		},
	};

	renderPanelEmpty = (title, copy) => (
		<div className="designer-panel-empty" role="status">
			<div className="designer-panel-empty-title">{title}</div>
			<div className="designer-panel-empty-copy">{copy}</div>
		</div>
	);

	renderItems = items => {
		if (!items.length) {
			return this.renderPanelEmpty(
				this.state.textSearch ? 'No matching components' : 'No components available',
				this.state.textSearch ? 'Try a different search term.' : 'Components will appear here when the library is loaded.',
			);
		}
		return (
			<Flex
				flexWrap="wrap"
				flexDirection="row"
				className="rde-tool-grid"
				justifyContent="center"
			>
				{items.map(item => this.renderItem(item))}
			</Flex>
		);
	};

	getPanelTitle = () => {
		const { activeSection, editorSession } = this.state;
		const { isCertificatePath } = editorSession;
		const titles = {
			design: isCertificatePath ? 'Certificate Designs' : 'Badge Designs',
			template: isCertificatePath ? 'Templates' : 'Shapes',
			'badge-template': 'Badge Templates',
			components: 'Components',
			attribute: 'Attributes',
		};
		return titles[activeSection] || 'Assets';
	};

	renderNavButton = (section, icon, label) => {
		const { activeSection } = this.state;
		const IconComponent = icon;
		return (
			<button
				type="button"
				className={`${activeSection === section ? 'leftbarmenu leftbarmenu-active' : 'leftbarmenu'}`}
				onClick={() => this.handlers.onSectionChange(section)}
				aria-pressed={activeSection === section}
				aria-label={label}
				title={label}
			>
				<IconComponent className="leftbarmenu-icon" />
				<span>{label}</span>
			</button>
		);
	};

	renderItem = (item, centered) => {
		const handleClick = () => {
			if (item.type === 'drawing') {
				this.handlers.onDrawingItem(item);
				return;
			}
			this.handlers.onAddItem(item, centered);
		};
		return (
			<button
				key={`${item.type}-${item.name}-${item.option?.type || item.option?.superType || 'asset'}`}
				type="button"
				draggable
				onClick={handleClick}
				onDragStart={e => this.events.onDragStart(e, item)}
				onDragEnd={e => this.events.onDragEnd(e)}
				className="rde-editor-items-item"
				aria-label={`Add ${item.name}`}
			>
				<span className="rde-editor-items-item-icon">
					<Icon name={item.icon.name} prefix={item.icon.prefix} style={item.icon.style} />
				</span>
				<span className="rde-editor-items-item-text">{item.name}</span>
			</button>
		);
	};

	render() {
		const canvasRef = this.getCanvasRef();
		const { descriptors } = this.props;
		const {
			collapse,
			textSearch,
			filteredDescriptors,
			svgModalVisible,
			svgOption,
			activeSection,
			editorSession,
		} = this.state;
		const className = classnames('rde-editor-items', {
			minimize: collapse,
		});

		const { isAdminPath, isCertificatePath, isAdminBadgePath } = editorSession;

		return (
			<div className={className}>
				<Flex flex="1" flexDirection="row" style={{ height: '100%' }}>
					<Flex
						justifyContent="flex-start"
						flexDirection="column"
						alignItems="center"
						className="rde-editor-items-rail"
					>
						<CommonButton
							icon={collapse ? 'angle-double-right' : 'angle-double-left'}
							shape="circle"
							className="rde-action-btn rde-editor-collapse-btn"
							onClick={this.handlers.onCollapse}
							tooltipTitle={collapse ? 'Expand assets panel' : 'Collapse assets panel'}
						/>
						{!isAdminPath && this.renderNavButton('design', AppstoreOutlined, 'Designs')}
						{isCertificatePath ? (
							this.renderNavButton('template', ProfileOutlined, 'Templates')
						) : (
							<>
							{this.renderNavButton('badge-template', ProfileOutlined, 'Templates')}
							{this.renderNavButton('template', PictureOutlined, 'Shapes')}
							</>
							
							
						)}

						{this.renderNavButton('components', LayoutOutlined, 'Components')}
						{this.renderNavButton('attribute', TagOutlined, 'Attributes')}
					</Flex>

					<Flex flex="1" flexDirection="column" className="rde-editor-items-panel">
						{collapse ? null : (
							<div className="rde-editor-items-panel-header">
								<div className="rde-editor-items-panel-title">{this.getPanelTitle()}</div>
							</div>
						)}
						{collapse || activeSection !== 'components' ? null : (
							<Input
								className="rde-editor-items-search"
								placeholder="Search components"
								onChange={this.handlers.onSearchNode}
								value={textSearch}
								allowClear
							/>
						)}
						<Scrollbar>
							{activeSection === 'components' && (
								<Flex flex="1" style={{ overflowY: 'hidden' }}>
									{(textSearch.length && this.renderItems(filteredDescriptors)) || (
										this.renderItems(this.handlers.transformList())
									)}
								</Flex>
							)}
							{activeSection === 'design' && !isAdminPath && (
								<Flex flex="1" style={{ overflowY: 'hidden' }}>
									{isCertificatePath ? (
										<Design
											canvasRef={canvasRef}
											onPageSizeChange={this.props.onPageSizeChange}
											onCanvasChange={this.props.onCanvasChange}
											mainLoader={this.props.mainLoader}
											onApplyCanvasAsset={this.props.onApplyCanvasAsset}
										/>
									) : (
										<BadgeDesign
											canvasRef={canvasRef}
											mainLoader={this.props.mainLoader}
											onCanvasChange={this.props.onCanvasChange}
											onApplyCanvasAsset={this.props.onApplyCanvasAsset}
										/>
									)}
								</Flex>
							)}

							{activeSection === 'template' && (
								<Flex flex="1" style={{ overflowY: 'hidden' }}>
									{isCertificatePath ? (
										<Templates
											canvasRef={canvasRef}
											onPageSizeChange={this.props.onPageSizeChange}
											onCanvasChange={this.props.onCanvasChange}
											mainLoader={this.props.mainLoader}
											onApplyCanvasAsset={this.props.onApplyCanvasAsset}
										/>
									) : (
										<BadgeBackground
											canvasRef={canvasRef}
											mainLoader={this.props.mainLoader}
											onCanvasChange={this.props.onCanvasChange}
											onApplyCanvasAsset={this.props.onApplyCanvasAsset}
										/>
									)}
								</Flex>
							)}
							{activeSection === 'badge-template' && (
								<Flex flex="1" style={{ overflowY: 'hidden' }}>
									<BadgeBackground
										canvasRef={canvasRef}
										mainLoader={this.props.mainLoader}
										onCanvasChange={this.props.onCanvasChange}
										badgeType="template"
										onApplyCanvasAsset={this.props.onApplyCanvasAsset}
									/>
								</Flex>
							)}
							{activeSection === 'attribute' && (
								<div>
									<Attributes canvasRef={canvasRef} />
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
