import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Input } from 'antd';

import Icon from '../../components/icon/Icon';
import { Flex } from '../../components/flex';
import i18next from 'i18next';

class ImageMapList extends Component {
	static propTypes = {
		canvasRef: PropTypes.any,
		selectedItem: PropTypes.object,
		onFocusCanvas: PropTypes.func,
	};

	state = {
		query: '',
	};

	getLayers = () => {
		const { canvasRef } = this.props;
		if (!canvasRef?.canvas) {
			return [];
		}

		return canvasRef.canvas
			.getObjects()
			.filter(obj => {
				if (obj.id === 'workarea' || obj.id === 'grid' || obj.superType === 'port') {
					return false;
				}
				if (obj.id) {
					return true;
				}
				return false;
			});
	};

	getVisibleLayers = () => {
		const query = this.state.query.trim().toLowerCase();
		const layers = this.getLayers();
		if (!query) {
			return layers;
		}
		return layers.filter(obj => `${obj.name || ''} ${obj.type || ''}`.toLowerCase().includes(query));
	};

	runCanvasAction = action => {
		const handler = this.props.canvasRef?.handler;
		if (!handler) {
			return;
		}
		action?.(handler);
		this.props.onFocusCanvas?.();
	};

	renderActions = () => {
		const { canvasRef, selectedItem } = this.props;
		const handler = canvasRef?.handler;
		const idCropping = handler?.interactionMode === 'crop';
		const disableLayerActions = !handler || idCropping || !selectedItem;
		return (
			<Flex.Item className="rde-canvas-list-actions" flex="0 1 auto">
				<Flex>
					<Input.Search
						allowClear
						placeholder="Search layers"
						value={this.state.query}
						onChange={event => this.setState({ query: event.target.value })}
					/>
				</Flex>
				<Flex justifyContent="space-between" alignItems="center">
					<Flex flex="1" justifyContent="center">
						<Button
							className="rde-action-btn"
							style={{ width: '100%', height: 30 }}
							disabled={disableLayerActions}
							onClick={() => this.runCanvasAction(handler => handler.sendBackwards())}
							aria-label={i18next.t('action.send-backwards')}
							title={i18next.t('action.send-backwards')}
						>
							<Icon name="arrow-up" />
						</Button>
					</Flex>
					<Flex flex="1" justifyContent="center">
						<Button
							className="rde-action-btn"
							style={{ width: '100%', height: 30 }}
							disabled={disableLayerActions}
							onClick={() => this.runCanvasAction(handler => handler.bringForward())}
							aria-label={i18next.t('action.bring-forward')}
							title={i18next.t('action.bring-forward')}
						>
							<Icon name="arrow-down" />
						</Button>
					</Flex>
				</Flex>
			</Flex.Item>
		);
	};

	renderItem = () => {
		const { canvasRef, selectedItem } = this.props;
		const handler = canvasRef?.handler;
		const idCropping = handler?.interactionMode === 'crop';
		if (!canvasRef?.canvas) {
			return null;
		}
		const layers = this.getVisibleLayers();
		if (!layers.length) {
			return (
				<div className="rde-canvas-list-empty">
					<div className="rde-canvas-list-empty-title">
						{this.state.query ? 'No matching layers' : 'No layers yet'}
					</div>
					<div className="rde-canvas-list-empty-copy">
						{this.state.query ? 'Try a different layer name or type.' : 'Add text, images, or shapes to build the design.'}
					</div>
				</div>
			);
		}
		return layers.map(obj => {
						let icon;
						let title = obj.name || obj.type;
						let prefix = 'fas';
						if (obj.type === 'i-text') {
							icon = 'map-marker-alt';
						} else if (obj.type === 'textbox') {
							icon = 'font';
						} else if (obj.type === 'image') {
							icon = 'image';
						} else if (obj.type === 'triangle') {
							icon = 'image';
						} else if (obj.type === 'rect') {
							icon = 'image';
						} else if (obj.type === 'circle') {
							icon = 'circle';
						} else if (obj.type === 'polygon') {
							icon = 'draw-polygon';
						} else if (obj.type === 'line') {
							icon = 'image';
						} else if (obj.type === 'element') {
							icon = 'html5';
							prefix = 'fab';
						} else if (obj.type === 'iframe') {
							icon = 'window-maximize';
						} else if (obj.type === 'video') {
							icon = 'video';
						} else if (obj.type === 'svg') {
							icon = 'bezier-curve';
						} else {
							icon = 'image';
							title = 'Default';
						}
						let className = 'rde-canvas-list-item';
						if (selectedItem && selectedItem.id === obj.id) {
							className += ' selected-item';
						}
						return (
							<Flex.Item
								key={obj.id}
								className={className}
								flex="1"
								onMouseDown={e => e.preventDefault()}
								onDoubleClick={e => {
									this.runCanvasAction(handler => handler.zoomHandler.zoomToCenter());
								}}
							>
								<Flex alignItems="center">
									<button
										type="button"
										className="rde-canvas-list-item-select"
										aria-label={`Select ${title}`}
										onClick={() => this.runCanvasAction(handler => handler.select(obj))}
									>
										<Icon
											className="rde-canvas-list-item-icon"
											name={icon}
											size={1.5}
											style={{ width: 32 }}
											prefix={prefix}
										/>
										<span className="rde-canvas-list-item-text">{title}</span>
									</button>
									<Flex className="rde-canvas-list-item-actions" flex="1" justifyContent="flex-end">
										<Button
											className="rde-action-btn"
											shape="circle"
											disabled={idCropping}
											aria-label={`Duplicate ${title}`}
											title={`Duplicate ${title}`}
											onClick={e => {
												e.stopPropagation();
												this.runCanvasAction(handler => handler.duplicateById(obj.id));
											}}
										>
											<Icon name="clone" />
										</Button>
										<Button
											className="rde-action-btn"
											shape="circle"
											disabled={idCropping}
											aria-label={`Delete ${title}`}
											title={`Delete ${title}`}
											onClick={e => {
												e.stopPropagation();
												this.runCanvasAction(handler => handler.removeById(obj.id));
											}}
										>
											<Icon name="trash" />
										</Button>
									</Flex>
								</Flex>
							</Flex.Item>
						);
					});
	};

	render() {
		return (
			<Flex style={{ height: '100%' }} flexDirection="column">
				{this.renderActions()}
				<div className="rde-canvas-list-items">{this.renderItem()}</div>
			</Flex>
		);
	}
}

export default ImageMapList;
