import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Switch, Tooltip } from 'antd';
import i18n from 'i18next';

import CommonButton from '../../components/common/CommonButton';
import { code } from '../../canvas/constants';

class ImageMapFooterToolbar extends Component {
	static propTypes = {
		canvasRef: PropTypes.any,
		preview: PropTypes.bool,
		onChangePreview: PropTypes.func,
		zoomRatio: PropTypes.number,
		gridEnabled: PropTypes.bool,
		snapToGrid: PropTypes.bool,
		guidesEnabled: PropTypes.bool,
		rulersEnabled: PropTypes.bool,
		safeAreaEnabled: PropTypes.bool,
		onToggleGrid: PropTypes.func,
		onToggleSnap: PropTypes.func,
		onToggleGuides: PropTypes.func,
		onToggleRulers: PropTypes.func,
		onToggleSafeArea: PropTypes.func,
	};

	state = {
		interactionMode: 'selection',
	};

	componentDidMount() {
		this.isFooterMounted = true;
		const { canvasRef } = this.props;
		this.waitForCanvasRender(canvasRef);
	}

	componentWillUnmount() {
		this.isFooterMounted = false;
		clearTimeout(this.waitForCanvasTimer);
		const { canvasRef } = this.props;
		this.detachEventListener(canvasRef);
	}

	waitForCanvasRender = canvas => {
		clearTimeout(this.waitForCanvasTimer);
		this.waitForCanvasTimer = setTimeout(() => {
			if (!this.isFooterMounted) {
				return;
			}
			if (canvas) {
				this.attachEventListener(canvas);
				return;
			}
			const { canvasRef } = this.props;
			this.waitForCanvasRender(canvasRef);
		}, 5);
	};

	attachEventListener = canvasRef => {
		if (!canvasRef?.canvas?.wrapperEl) {
			return;
		}
		canvasRef.canvas.wrapperEl.addEventListener('keydown', this.events.keydown, false);
	};

	detachEventListener = canvasRef => {
		if (!canvasRef?.canvas?.wrapperEl) {
			return;
		}
		canvasRef.canvas.wrapperEl.removeEventListener('keydown', this.events.keydown);
	};

	/* eslint-disable react/sort-comp, react/prop-types */
	handlers = {
		selection: () => {
			if (this.props.canvasRef.handler.interactionHandler.isDrawingMode()) {
				return;
			}
			this.forceUpdate();
			this.props.canvasRef.handler.interactionHandler.selection();
			this.setState({ interactionMode: 'selection' });
		},
		grab: () => {
			if (this.props.canvasRef.handler.interactionHandler.isDrawingMode()) {
				return;
			}
			this.forceUpdate();
			this.props.canvasRef.handler.interactionHandler.grab();
			this.setState({ interactionMode: 'grab' });
		},
	};

	events = {
		keydown: e => {
			if (this.props.canvasRef.canvas.wrapperEl !== document.activeElement) {
				return false;
			}
			if (e.code === code.KEY_Q) {
				this.handlers.selection();
			} else if (e.code === code.KEY_W) {
				this.handlers.grab();
			}
		},
	};

	render() {
		const {
			canvasRef,
			preview,
			zoomRatio,
			onChangePreview,
			gridEnabled,
			snapToGrid,
			guidesEnabled,
			rulersEnabled,
			safeAreaEnabled,
			onToggleGrid,
			onToggleSnap,
			onToggleGuides,
			onToggleRulers,
			onToggleSafeArea,
		} = this.props;
		const { interactionMode } = this.state;
		const { selection, grab } = this.handlers;
		if (!canvasRef) {
			return null;
		}
		const zoomValue = parseInt((zoomRatio * 100).toFixed(2), 10);
		return (
			<React.Fragment>
				<div className="rde-editor-footer-toolbar-interaction">
					<Button.Group>
						<CommonButton
							type={interactionMode === 'selection' ? 'primary' : 'default'}
							style={{ borderBottomLeftRadius: '8px', borderTopLeftRadius: '8px' }}
							onClick={() => {
								selection();
							}}
							icon="mouse-pointer"
							tooltipTitle={i18n.t('action.selection')}
						/>
						<CommonButton
							type={interactionMode === 'grab' ? 'primary' : 'default'}
							style={{ borderBottomRightRadius: '8px', borderTopRightRadius: '8px' }}
							onClick={() => {
								grab();
							}}
							tooltipTitle={i18n.t('action.grab')}
							icon="hand-rock"
						/>
					</Button.Group>
				</div>
				<div className="rde-editor-footer-toolbar-zoom">
					<Button.Group>
						<CommonButton
							style={{ borderBottomLeftRadius: '8px', borderTopLeftRadius: '8px' }}
							onClick={() => {
								canvasRef.handler.zoomHandler.zoomOut();
							}}
							icon="search-minus"
							tooltipTitle={i18n.t('action.zoom-out')}
						/>
						<CommonButton
							onClick={() => {
								canvasRef.handler.zoomHandler.zoomOneToOne();
							}}
							tooltipTitle={i18n.t('action.one-to-one')}
						>
							{`${zoomValue}%`}
						</CommonButton>
						<CommonButton
							onClick={() => {
								canvasRef.handler.zoomHandler.zoomToFit();
							}}
							tooltipTitle={i18n.t('action.fit')}
							icon="expand"
						/>
						<CommonButton
							style={{ borderBottomRightRadius: '8px', borderTopRightRadius: '8px' }}
							onClick={() => {
								canvasRef.handler.zoomHandler.zoomIn();
							}}
							icon="search-plus"
							tooltipTitle={i18n.t('action.zoom-in')}
						/>
					</Button.Group>
				</div>
				<div className="rde-editor-footer-toolbar-aids">
					<Button.Group>
						<CommonButton
							type={gridEnabled ? 'primary' : 'default'}
							style={{ borderBottomLeftRadius: '8px', borderTopLeftRadius: '8px' }}
							onClick={onToggleGrid}
							icon="th"
							tooltipTitle="Grid"
						/>
						<CommonButton
							type={snapToGrid ? 'primary' : 'default'}
							onClick={onToggleSnap}
							icon="magnet"
							tooltipTitle="Snap"
						/>
						<CommonButton
							type={guidesEnabled ? 'primary' : 'default'}
							onClick={onToggleGuides}
							icon="ruler-combined"
							tooltipTitle="Guides"
						/>
						<CommonButton
							type={rulersEnabled ? 'primary' : 'default'}
							onClick={onToggleRulers}
							icon="ruler-horizontal"
							tooltipTitle="Rulers"
						/>
						<CommonButton
							type={safeAreaEnabled ? 'primary' : 'default'}
							style={{ borderBottomRightRadius: '8px', borderTopRightRadius: '8px' }}
							onClick={onToggleSafeArea}
							icon="vector-square"
							tooltipTitle="Safe area"
						/>
					</Button.Group>
				</div>
				{/* <div className="rde-editor-footer-toolbar-preview">
					<Tooltip title={i18n.t('action.preview')}>
						<Switch checked={preview} onChange={onChangePreview} />
					</Tooltip>
				</div> */}
			</React.Fragment>
		);
	}
}

export default ImageMapFooterToolbar;
