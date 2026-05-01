import i18n from 'i18next';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Popover, Select } from 'antd';
import { CommonButton } from '../../components/common';
import { Flex } from '../../components/flex';
import ImageMapList from './ImageMapList';
import { parseEditorSession } from '../../utils/editorSession';

const { Option } = Select;

class ImageMapHeaderToolbar extends Component {
	static propTypes = {
		canvasRef: PropTypes.any,
		selectedItem: PropTypes.object,
		onPageSizeChange: PropTypes.func,
		selectedPageSize: PropTypes.any,
		onClassNameUpdate: PropTypes.func,
		onFocusCanvas: PropTypes.func,
	};

	constructor(props) {
		super(props);
		this.state = {
			collapse: false,
			layerListVisible: false,
		};
	}

	handlers = {
		onCollapse: () => {
			this.setState(
				prevState => ({ collapse: !prevState.collapse }),
				() => {
					const className = this.state.collapse ? 'minimize' : '';
					this.props.onClassNameUpdate?.(className);
					this.props.onFocusCanvas?.();
				},
			);
		},
		onLayerListVisibleChange: layerListVisible => {
			this.setState({ layerListVisible }, () => {
				if (!layerListVisible) {
					this.props.onFocusCanvas?.();
				}
			});
		},
		runCanvasAction: action => {
			const handler = this.props.canvasRef?.handler;
			if (!handler) {
				return;
			}
			action?.(handler);
			this.props.onFocusCanvas?.();
		},
	};

	render() {
		const { canvasRef, selectedItem, onPageSizeChange, selectedPageSize } = this.props;
		const { collapse, layerListVisible } = this.state;
		const { onCollapse, onLayerListVisibleChange, runCanvasAction } = this.handlers;
		const handler = canvasRef?.handler;
		const hasSelection = Boolean(selectedItem);
		const isCropping = handler?.interactionMode === 'crop';
		const disableObjectActions = !handler || !hasSelection || isCropping;
		const hasCropRect = Boolean(handler?.cropHandler?.cropRect);
		const canCropSelection = Boolean(hasSelection && handler?.cropHandler?.validType());
		const showCropControls = canCropSelection || hasCropRect || isCropping;
		const showAdvancedObjectControls = collapse;
		const advancedObjectControls = (
			<div className="rde-object-actions-popover" role="toolbar" aria-label="Object alignment and grouping">
				<CommonButton
					className="rde-action-btn align-action-btn"
					shape="circle"
					disabled={disableObjectActions}
					onClick={() => runCanvasAction(handler => handler.alignmentHandler.left())}
					icon="align-left"
					tooltipTitle={i18n.t('action.align-left')}
				/>
				<CommonButton
					className="rde-action-btn align-action-btn"
					shape="circle"
					disabled={disableObjectActions}
					onClick={() => runCanvasAction(handler => handler.alignmentHandler.center())}
					icon="align-center"
					tooltipTitle={i18n.t('action.align-center')}
				/>
				<CommonButton
					className="rde-action-btn align-action-btn"
					shape="circle"
					disabled={disableObjectActions}
					onClick={() => runCanvasAction(handler => handler.alignmentHandler.middle())}
					icon="arrows-alt-v"
					tooltipTitle={i18n.t('action.align-middle')}
				/>
				<CommonButton
					className="rde-action-btn align-action-btn"
					shape="circle"
					disabled={disableObjectActions}
					onClick={() => runCanvasAction(handler => handler.alignmentHandler.right())}
					icon="align-right"
					tooltipTitle={i18n.t('action.align-right')}
				/>
				<span className="rde-object-actions-divider" aria-hidden="true" />
				<CommonButton
					className="rde-action-btn"
					shape="circle"
					disabled={disableObjectActions}
					onClick={() => runCanvasAction(handler => handler.toGroup())}
					icon="object-group"
					tooltipTitle={i18n.t('action.object-group')}
				/>
				<CommonButton
					className="rde-action-btn"
					shape="circle"
					disabled={disableObjectActions}
					onClick={() => runCanvasAction(handler => handler.toActiveSelection())}
					icon="object-ungroup"
					tooltipTitle={i18n.t('action.object-ungroup')}
				/>
			</div>
		);

		const { isCertificatePath } = parseEditorSession();

		return (
			<Flex className="rde-editor-header-toolbar-container" flex="1" role="toolbar" aria-label="Canvas controls">
				<Flex.Item className="rde-canvas-toolbar rde-canvas-toolbar-list">
					<Popover
						content={(
							<div className="rde-canvas-list-popover">
								<ImageMapList canvasRef={canvasRef} selectedItem={selectedItem} onFocusCanvas={this.props.onFocusCanvas} />
							</div>
						)}
						overlayClassName="rde-layer-list-popover"
						placement="bottomLeft"
						trigger="click"
						visible={layerListVisible}
						onVisibleChange={onLayerListVisibleChange}
					>
						<CommonButton
							className="rde-action-btn"
							shape="circle"
							icon="layer-group"
							tooltipTitle={i18n.t('action.canvas-list')}
							ariaPressed={layerListVisible}
						/>
					</Popover>
				</Flex.Item>
				<Flex.Item className="rde-canvas-toolbar rde-canvas-toolbar-inspector-toggle">
					<CommonButton
						className="rde-action-btn"
						shape="circle"
						icon={collapse ? 'angle-double-right' : 'angle-double-left'}
						onClick={onCollapse}
						tooltipTitle={collapse ? 'Expand inspector' : 'Collapse inspector'}
					/>
				</Flex.Item>
				<Flex.Item className="rde-canvas-toolbar rde-canvas-toolbar-history">
					{isCertificatePath && (
						<Select
							placeholder="Page Size"
							style={{ width: 120 }}
							value={selectedPageSize}
							onChange={value => {
								onPageSizeChange?.(value);
								this.props.onFocusCanvas?.();
							}}
						>
							<Option value="a4portrait">A4 Portrait</Option>
							<Option value="a4landscape">A4 Landscape</Option>
						</Select>
					)}

					<CommonButton
						className="rde-action-btn toolbar-btn-cls"
						disabled={!handler || isCropping || !handler.transactionHandler.undos.length}
						icon="undo-alt"
						onClick={() => runCanvasAction(handler => handler.transactionHandler.undo())}
						tooltipTitle="Undo"
					/>
					<CommonButton
						className="rde-action-btn toolbar-btn-cls"
						disabled={!handler || isCropping || !handler.transactionHandler.redos.length}
						icon="redo-alt"
						onClick={() => runCanvasAction(handler => handler.transactionHandler.redo())}
						tooltipTitle="Redo"
					/>
				</Flex.Item>
				{hasSelection && (
					<React.Fragment>
						<Flex.Item className="rde-canvas-toolbar rde-canvas-toolbar-operation">
							<CommonButton
								className="rde-action-btn"
								shape="circle"
								disabled={disableObjectActions}
								onClick={() => runCanvasAction(handler => handler.saveImage())}
								icon="image"
								tooltipTitle={i18n.t('action.canvas-save')}
							/>
							<CommonButton
								className="rde-action-btn"
								shape="circle"
								disabled={disableObjectActions}
								onClick={() => runCanvasAction(handler => handler.duplicate())}
								icon="clone"
								tooltipTitle={i18n.t('action.clone')}
							/>
							<CommonButton
								className="rde-action-btn"
								shape="circle"
								disabled={disableObjectActions}
								onClick={() => runCanvasAction(handler => handler.remove())}
								icon="trash"
								tooltipTitle={i18n.t('action.delete')}
							/>
						</Flex.Item>
						<Flex.Item className="rde-canvas-toolbar rde-canvas-toolbar-alignment">
							<CommonButton
								className="rde-action-btn"
								shape="circle"
								disabled={disableObjectActions}
								onClick={() => runCanvasAction(handler => handler.bringForward())}
								icon="angle-up"
								tooltipTitle={i18n.t('action.bring-forward')}
							/>
							<CommonButton
								className="rde-action-btn"
								shape="circle"
								disabled={disableObjectActions}
								onClick={() => runCanvasAction(handler => handler.sendBackwards())}
								icon="angle-down"
								tooltipTitle={i18n.t('action.send-backwards')}
							/>
							<CommonButton
								className="rde-action-btn"
								shape="circle"
								disabled={disableObjectActions}
								onClick={() => runCanvasAction(handler => handler.bringToFront())}
								icon="angle-double-up"
								tooltipTitle={i18n.t('action.bring-to-front')}
							/>
							<CommonButton
								className="rde-action-btn"
								shape="circle"
								disabled={disableObjectActions}
								onClick={() => runCanvasAction(handler => handler.sendToBack())}
								icon="angle-double-down"
								tooltipTitle={i18n.t('action.send-to-back')}
							/>
						</Flex.Item>
						{showAdvancedObjectControls && (
							<React.Fragment>
								<Flex.Item className="rde-canvas-toolbar rde-canvas-toolbar-alignment">
									{advancedObjectControls}
								</Flex.Item>
							</React.Fragment>
						)}
						{!showAdvancedObjectControls && (
							<Flex.Item className="rde-canvas-toolbar rde-canvas-toolbar-more">
								<Popover content={advancedObjectControls} placement="bottom" trigger="click">
									<CommonButton
										className="rde-action-btn"
										shape="circle"
										disabled={disableObjectActions}
										icon="ellipsis-h"
										tooltipTitle="More object actions"
										ariaLabel="More object actions"
									/>
								</Popover>
							</Flex.Item>
						)}
						{showCropControls && (
							<Flex.Item className="rde-canvas-toolbar rde-canvas-toolbar-crop">
								<CommonButton
									className="rde-action-btn"
									shape="circle"
									disabled={!canCropSelection}
									onClick={() => runCanvasAction(handler => handler.cropHandler.start())}
									icon="crop"
									tooltipTitle={i18n.t('action.crop')}
								/>
								<CommonButton
									className="rde-action-btn"
									shape="circle"
									disabled={!hasCropRect}
									onClick={() => runCanvasAction(handler => handler.cropHandler.finish())}
									icon="check"
									tooltipTitle={i18n.t('action.crop-save')}
								/>
								<CommonButton
									className="rde-action-btn"
									shape="circle"
									disabled={!hasCropRect}
									onClick={() => runCanvasAction(handler => handler.cropHandler.cancel())}
									icon="times"
									tooltipTitle={i18n.t('action.crop-cancel')}
								/>
							</Flex.Item>
						)}
					</React.Fragment>
				)}
			</Flex>
		);
	}
}


export default ImageMapHeaderToolbar;
