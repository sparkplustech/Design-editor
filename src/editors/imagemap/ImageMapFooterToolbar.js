import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Popover, Switch, Tooltip } from 'antd';
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
		interactionMode: PropTypes.string,
		onToggleGrid: PropTypes.func,
		onToggleSnap: PropTypes.func,
		onToggleGuides: PropTypes.func,
		onToggleRulers: PropTypes.func,
		onToggleSafeArea: PropTypes.func,
		onFocusCanvas: PropTypes.func,
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
		focusCanvas: () => {
			this.props.onFocusCanvas?.();
		},
		selection: () => {
			if (this.props.canvasRef.handler.interactionHandler.isDrawingMode()) {
				return;
			}
			this.forceUpdate();
			this.props.canvasRef.handler.interactionHandler.selection();
			this.setState({ interactionMode: 'selection' });
			this.handlers.focusCanvas();
		},
		grab: () => {
			if (this.props.canvasRef.handler.interactionHandler.isDrawingMode()) {
				return;
			}
			this.forceUpdate();
			this.props.canvasRef.handler.interactionHandler.grab();
			this.setState({ interactionMode: 'grab' });
			this.handlers.focusCanvas();
		},
		zoomOut: () => {
			this.props.canvasRef.handler.zoomHandler.zoomOut();
			this.handlers.focusCanvas();
		},
		zoomOneToOne: () => {
			this.props.canvasRef.handler.zoomHandler.zoomOneToOne();
			this.handlers.focusCanvas();
		},
		zoomToRatio: ratio => {
			this.props.canvasRef.handler.zoomHandler.zoomToRatio(ratio);
			this.handlers.focusCanvas();
		},
		zoomToFit: () => {
			this.props.canvasRef.handler.zoomHandler.zoomToFit();
			this.handlers.focusCanvas();
		},
		zoomIn: () => {
			this.props.canvasRef.handler.zoomHandler.zoomIn();
			this.handlers.focusCanvas();
		},
		toggleGrid: () => {
			this.props.onToggleGrid?.();
			this.handlers.focusCanvas();
		},
		toggleSnap: () => {
			this.props.onToggleSnap?.();
			this.handlers.focusCanvas();
		},
		toggleGuides: () => {
			this.props.onToggleGuides?.();
			this.handlers.focusCanvas();
		},
		toggleRulers: () => {
			this.props.onToggleRulers?.();
			this.handlers.focusCanvas();
		},
		toggleSafeArea: () => {
			this.props.onToggleSafeArea?.();
			this.handlers.focusCanvas();
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
			interactionMode: interactionModeProp,
		} = this.props;
		const interactionMode = interactionModeProp || this.state.interactionMode;
		const {
			selection,
			grab,
			zoomOut,
			zoomOneToOne,
			zoomToRatio,
			zoomToFit,
			zoomIn,
			toggleGrid,
			toggleSnap,
			toggleGuides,
			toggleRulers,
			toggleSafeArea,
		} = this.handlers;
		if (!canvasRef) {
			return null;
		}
		const zoomValue = parseInt((zoomRatio * 100).toFixed(2), 10);
		const shortcutContent = (
			<div className="rde-shortcut-card">
				<div><kbd>Q</kbd><span>Select</span></div>
				<div><kbd>W</kbd><span>Pan canvas</span></div>
				<div><kbd>Space</kbd><span>Hold to pan temporarily</span></div>
				<div><kbd>Alt</kbd><span>Temporary pan while dragging</span></div>
				<div><kbd>+</kbd><kbd>-</kbd><span>Zoom in/out</span></div>
				<div><kbd>O</kbd><span>100% zoom</span></div>
				<div><kbd>P</kbd><span>Fit canvas</span></div>
				<div><kbd>Ctrl</kbd><kbd>Z</kbd><span>Undo</span></div>
			</div>
		);
		const zoomPresetContent = (
			<div className="rde-zoom-preset-card" role="menu" aria-label="Zoom presets">
				<button type="button" onClick={zoomToFit}>Fit canvas</button>
				<button type="button" onClick={() => zoomToRatio(0.5)}>50%</button>
				<button type="button" onClick={() => zoomToRatio(0.75)}>75%</button>
				<button type="button" onClick={zoomOneToOne}>100%</button>
				<button type="button" onClick={() => zoomToRatio(1.25)}>125%</button>
				<button type="button" onClick={() => zoomToRatio(1.5)}>150%</button>
				<button type="button" onClick={() => zoomToRatio(2)}>200%</button>
			</div>
		);
		return (
			<React.Fragment>
				<div className="rde-editor-footer-toolbar-interaction">
					<Button.Group>
						<CommonButton
							type={interactionMode === 'selection' ? 'primary' : 'default'}
							ariaPressed={interactionMode === 'selection'}
							style={{ borderBottomLeftRadius: '8px', borderTopLeftRadius: '8px' }}
							onClick={() => {
								selection();
							}}
							icon="mouse-pointer"
							tooltipTitle={i18n.t('action.selection')}
						/>
						<CommonButton
							type={interactionMode === 'grab' ? 'primary' : 'default'}
							ariaPressed={interactionMode === 'grab'}
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
							onClick={zoomOut}
							icon="search-minus"
							tooltipTitle={i18n.t('action.zoom-out')}
						/>
						<Popover content={zoomPresetContent} placement="top" trigger="click">
							<CommonButton
								tooltipTitle="Zoom presets"
								ariaLabel={`Zoom presets, current zoom ${zoomValue}%`}
							>
								{`${zoomValue}%`}
							</CommonButton>
						</Popover>
						<CommonButton
							onClick={zoomToFit}
							tooltipTitle={i18n.t('action.fit')}
							icon="expand"
						/>
						<CommonButton
							style={{ borderBottomRightRadius: '8px', borderTopRightRadius: '8px' }}
							onClick={zoomIn}
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
							onClick={toggleGrid}
							icon="th"
							tooltipTitle="Grid"
						/>
						<CommonButton
							type={snapToGrid ? 'primary' : 'default'}
							onClick={toggleSnap}
							icon="magnet"
							tooltipTitle="Snap"
						/>
						<CommonButton
							type={guidesEnabled ? 'primary' : 'default'}
							onClick={toggleGuides}
							icon="ruler-combined"
							tooltipTitle="Guides"
						/>
						<CommonButton
							type={rulersEnabled ? 'primary' : 'default'}
							onClick={toggleRulers}
							icon="ruler-horizontal"
							tooltipTitle="Rulers"
						/>
						<CommonButton
							type={safeAreaEnabled ? 'primary' : 'default'}
							style={{ borderBottomRightRadius: '8px', borderTopRightRadius: '8px' }}
							onClick={toggleSafeArea}
							icon="vector-square"
							tooltipTitle="Safe area"
						/>
					</Button.Group>
				</div>
				<div className="rde-editor-footer-toolbar-help">
					<Popover content={shortcutContent} placement="topRight" trigger="click">
						<CommonButton
							icon="keyboard"
							tooltipTitle="Keyboard shortcuts"
							ariaLabel="Keyboard shortcuts"
							onClick={this.handlers.focusCanvas}
						/>
					</Popover>
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
