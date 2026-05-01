import { Badge, Button, Menu, Popconfirm, message, Spin } from 'antd';
import i18n from 'i18next';
import debounce from 'lodash/debounce';
import React, { Component } from 'react';
import { Input, Modal } from 'antd';
import Canvas from '../../canvas/Canvas';
import CommonButton from '../../components/common/CommonButton';
import { Content } from '../../components/layout';
import SandBox from '../../components/sandbox/SandBox';
import '../../libs/fontawesome-5.2.0/css/all.css';
import '../../styles/index.less';
import ImageMapConfigurations from './ImageMapConfigurations';
import ImageMapFooterToolbar from './ImageMapFooterToolbar';
import ImageMapHeaderToolbar from './ImageMapHeaderToolbar';
import ImageMapItems from './ImageMapItems';
import ImageMapPreview from './ImageMapPreview';
import ImageMapTitle from './ImageMapTitle';
import CONSTANTS from '../../../constant';
import { Flex } from '../../components/flex';
import {
	authHeaders,
	fetchDesignerJson,
	getCanvasObjects,
	isOptionalDesignerSessionError,
	loadDesignerSession,
} from '../../utils/designerApi';
import { parseEditorSession } from '../../utils/editorSession';
import { getBlockingProofIssues, getDesignProofIssues, summarizeProofIssues } from '../../utils/designProof';

const propertiesToInclude = [
	'id',
	'name',
	'locked',
	'file',
	'src',
	'link',
	'tooltip',
	'animation',
	'layout',
	'workareaWidth',
	'workareaHeight',
	'videoLoadType',
	'autoplay',
	'shadow',
	'muted',
	'loop',
	'code',
	'icon',
	'userProperty',
	'trigger',
	'configuration',
	'superType',
	'points',
	'svg',
	'loadType',
];

const defaultOption = {
	stroke: 'rgba(255, 255, 255, 0)',
	strokeUniform: true,
	resource: {},
	link: {
		enabled: false,
		type: 'resource',
		state: 'new',
		dashboard: {},
	},
	tooltip: {
		enabled: true,
		type: 'resource',
		template: '<div>{{message.name}}</div>',
	},
	animation: {
		type: 'none',
		loop: true,
		autoplay: true,
		duration: 1000,
	},
	userProperty: {},
	trigger: {
		enabled: false,
		type: 'alarm',
		script: 'return message.value > 0;',
		effect: 'style',
	},
};

class ImageMapEditor extends Component {
	state = {
		selectedItem: null,
		zoomRatio: 1,
		preview: false,
		loading: false,
		progress: 0,
		animations: [],
		styles: [],
		dataSources: [],
		editing: false,
		descriptors: {},
		objects: undefined,
		isInputEmpty: true,
		inputData: '',
		selectedPageSize: 'a4landscape',
		currentPath: '',
		editId: '',
		templateData: [],
		isEdit: false,
		isAdminPath: false,
		isCertificatePath: false,
		isBadgePath: false,
		designCode: '',
		credId: '',
		userData: '',
		badgeId: '',
		certId: '',
		isSaving: false,
		autoSaveId: '',
		createTemplateCalled: false,
		successMessage: '',
		errorMessage: '',
		isDesignTemplate: false,
		isAdminBadgePath: false,
		previewVisible: false,
		previewImage: '',
		toolbarClass: '',
		skip: 0,
		proofIssues: [],
		proofModalVisible: false,
		gridEnabled: false,
		snapToGrid: false,
		guidesEnabled: true,
		rulersEnabled: true,
		safeAreaEnabled: true,
		interactionMode: 'selection',
	};

	isEditorMounted = false;

	importObjectsTimer = null;

	editRevision = 0;

	temporaryPanWasGrab = false;

	getExportMultiplier = () => 1;

	normalizeDesignName = value => {
		if (value === null || value === undefined || value === 'null') {
			return '';
		}

		return `${value}`.trim();
	};

	validateDesignName = () => {
		if (!this.normalizeDesignName(this.state.inputData)) {
			const errorMessage = 'Enter a design name before saving.';
			this.setState({ errorMessage, successMessage: '' });
			message.warning(errorMessage);
			return false;
		}

		return true;
	};

	runDesignProofValidation = ({ showMessage = true } = {}) => {
		const proofIssues = getDesignProofIssues(this.canvasRef);
		const blockingIssues = getBlockingProofIssues(proofIssues);

		this.setState({ proofIssues });

		if (showMessage && proofIssues.length > 0) {
			const summary = summarizeProofIssues(proofIssues);
			if (blockingIssues.length > 0) {
				message.error(summary);
			} else {
				message.warning(summary);
			}
		}

		return { proofIssues, blockingIssues };
	};

	fitCanvasToViewport = () => {
		const handler = this.canvasRef?.handler;
		if (!handler?.canvas || !handler?.workarea || !handler?.zoomHandler) {
			return;
		}

		handler.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
		handler.canvas.centerObject(handler.workarea);
		handler.workarea.setCoords();
		handler.zoomHandler.zoomToFit();
		this.syncSafeAreaOverlay();
	};

	handleWindowResizeFit = debounce(() => {
		this.fitCanvasToViewport();
	}, 160);

	handleCanvasLoad = () => {
		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				this.fitCanvasToViewport();
				this.syncSafeAreaOverlay();
			});
		});
	};

	syncSafeAreaOverlay = () => {
		this.canvasRef?.handler?.setSafeAreaOption?.({
			enabled: this.state.safeAreaEnabled,
			margin: this.state.isBadgePath ? 32 : 42,
		});
	};

	getCanvasImageDataUrl = option => {
		const cachedViewportTransform = this.canvasRef.canvas.viewportTransform;
		const exportHiddenObjects = this.canvasRef.canvas
			.getObjects()
			.filter(obj => obj.id === 'grid' || obj.id === 'safe-area')
			.map(obj => ({ obj, visible: obj.visible }));
		const { workarea } = this.canvasRef.handler;
		const cachedWorkareaShadow = workarea.shadow;
		let { width, height, scaleX, scaleY } = this.canvasRef.handler.workarea;
		width = Math.ceil(width * scaleX);
		height = Math.ceil(height * scaleY);
		this.canvasRef.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
		exportHiddenObjects.forEach(({ obj }) => obj.set('visible', false));
		workarea.set('shadow', null);

		try {
			return this.canvasRef.canvas.toDataURL({
				...option,
				left: 0,
				top: 0,
				width,
				height,
				multiplier: this.getExportMultiplier(),
				enableRetinaScaling: true,
			});
		} finally {
			workarea.set('shadow', cachedWorkareaShadow);
			exportHiddenObjects.forEach(({ obj, visible }) => obj.set('visible', visible));
			this.canvasRef.canvas.viewportTransform = cachedViewportTransform;
			this.canvasRef.canvas.requestRenderAll();
		}
	};

	dataUrlToBlob = dataURL => {
		const [metadata, data] = dataURL.split(',');
		const mimeMatch = metadata.match(/data:(.*);base64/);
		const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
		const binary = window.atob(data);
		const bytes = new Uint8Array(binary.length);

		for (let index = 0; index < binary.length; index += 1) {
			bytes[index] = binary.charCodeAt(index);
		}

		return new Blob([bytes], { type: mimeType });
	};

	componentDidMount() {
		this.isEditorMounted = true;
		window.addEventListener('resize', this.handleWindowResizeFit);
		document.addEventListener('keydown', this.handleEditorShortcutKeyDown, false);
		document.addEventListener('keyup', this.handleEditorShortcutKeyUp, false);
		this.showLoading(true);
		import('./Descriptors.json').then(descriptors => {
			if (!this.isEditorMounted) {
				return;
			}
			this.setState(
				{
					descriptors,
				},
				() => {
					this.showLoading(false);
				},
			);
		});
		this.setState({
			selectedItem: null,
		});

		const editorSession = parseEditorSession();
		const {
			queryParams,
			designCode,
			currentPath,
			isAdminPath,
			isCertificatePath,
			isBadgePath,
			isAdminBadgePath,
			isEdit,
			id,
			credId,
			badgeId,
			certId,
			isDesignTemplate,
			skip,
		} = editorSession;

		if (isBadgePath) {
			this.canvasHandlers.onChangeWokarea('width', '', { width: 600, height: 600 });
			this.canvasHandlers.onChangeWokarea('backgroundColor', '', '');
			this.canvasHandlers.onChangeWokarea('src', './images/sample/transparentBg.png', '');
		}

		this.setState({
			currentPath: currentPath,
			isAdminPath: isAdminPath,
			isCertificatePath: isCertificatePath,
			isBadgePath: isBadgePath,
			designCode: designCode,
			isAdminBadgePath: isAdminBadgePath,
		});

		this.setState({
			editId: id,
			isEdit: isEdit,
			credId: credId,
			designCode: designCode,
			badgeId: badgeId,
			certId: certId,
			isDesignTemplate: isDesignTemplate,
			skip: skip,
		});

		const handleFetch = async (accessToken, isBadgePath, id) => {
			if (!this.isEditorMounted) {
				return;
			}
			this.setState({ loading: true, createTemplateCalled: true });
			const templateEndpoint = isAdminPath
				? isBadgePath
					? `/templates/getBadgeTemplate/${id}`
					: `/templates/getCertificateTemplate/${id}`
				: isBadgePath
				? `/templates/getUserBadgeTemplate/${id}`
				: `/templates/getUserCertificateTemplate/${id}`;

			try {
				const data = await fetchDesignerJson(templateEndpoint, {
					headers: authHeaders(accessToken),
				});
				if (!this.isEditorMounted) {
					return;
				}

				if (data.statusCode === 400) {
					queryParams.delete('id');
					queryParams.delete('edit');
					const newUrl = `${window.location.pathname}?designCode=${designCode}`;
					window.history.replaceState({}, '', newUrl);
					this.setState({ loading: false, inputData: '', isInputEmpty: true, editId: '' });
					return;
				}

				if (data?.templateCode !== '') {
					const objects = getCanvasObjects(data?.templateCode);
					const importObjects = this.state.isBadgePath ? [CONSTANTS.JSON_CONSTANT.BADGE, ...objects] : objects;

					this.canvasRef.handler.clear(true);
					clearTimeout(this.importObjectsTimer);
					this.importObjectsTimer = setTimeout(() => {
						if (this.isEditorMounted) {
							this.canvasRef.handler.importJSON(importObjects).then(this.syncSafeAreaOverlay);
						}
					}, 50);
				}

				const loadedName = this.normalizeDesignName(data?.name);

				this.setState({
					loading: false,
					inputData: loadedName,
					isInputEmpty: loadedName === '',
					selectedPageSize: data?.pageSize,
				});
			} catch (error) {
				if (!this.isEditorMounted) {
					return;
				}
				message.error('Unable to load the selected design.');
				this.setState({ loading: false });
			}
		};

		loadDesignerSession()
			.then(data => {
				if (!this.isEditorMounted) {
					return;
				}
				this.setState({ userData: data });
				if (data.designId) {
					this.setState({ loading: true, createTemplateCalled: true, isEdit: true, editId: data.designId });
					const isBadgePath = data.type === 'badge';
					handleFetch(data.accessToken, isBadgePath, data.designId);
				} else if (isEdit && id) {
					handleFetch(data.accessToken, isBadgePath, id);
				} else {
					this.setState({ loading: true });
					this.createTemplate(data);
				}
			})
			.catch(error => {
				if (!this.isEditorMounted) {
					return;
				}
				if (!isOptionalDesignerSessionError(error)) {
					message.error('Unable to start designer session.');
					this.setState({ errorMessage: 'Designer session unavailable.', successMessage: '' });
				}
				this.setState({ loading: false });
			});

		this.autoSave = setInterval(() => {
			if (this.state.createTemplateCalled && this.state.editing) {
				this.editTemplate('autoSave');
			}
		}, 30000);
	}

	// componentDidUpdate(prevState) {
	// 	if (!prevState.editing && this.state.editing && !this.state.createTemplateCalled && !this.state.isEdit) {
	// 		this.createTemplate(this.state.userData);
	// 		this.setState({
	// 			createTemplateCalled: true,
	// 			successMessage: '',
	// 			successMessageVisible: true,
	// 		});

	// 		if (this.clearSuccessMessageTimer) {
	// 			clearTimeout(this.clearSuccessMessageTimer);
	// 		}

	// 		this.clearSuccessMessageTimer = setTimeout(() => {
	// 			this.setState({
	// 				successMessage: '',
	// 				successMessageVisible: false,
	// 			});
	// 		}, 10000);
	// 	}
	// }

	componentWillUnmount() {
		this.isEditorMounted = false;
		window.removeEventListener('resize', this.handleWindowResizeFit);
		document.removeEventListener('keydown', this.handleEditorShortcutKeyDown);
		document.removeEventListener('keyup', this.handleEditorShortcutKeyUp);
		this.handleWindowResizeFit.cancel();
		clearTimeout(this.importObjectsTimer);
		clearInterval(this.autoSave);
		clearTimeout(this.clearSuccessMessageTimer);
	}

	focusCanvas = () => {
		this.canvasRef?.canvas?.wrapperEl?.focus?.();
	};

	runContextCanvasAction = action => {
		const handler = this.canvasRef?.handler;
		if (!handler) {
			return;
		}
		action(handler);
		this.focusCanvas();
	};

	shouldIgnoreEditorShortcut = event => {
		const target = event.target;
		if (!target || !target.closest) {
			return false;
		}
		const tagName = target.tagName ? target.tagName.toLowerCase() : '';
		return (
			tagName === 'input' ||
			tagName === 'textarea' ||
			tagName === 'select' ||
			target.isContentEditable ||
			Boolean(target.closest('.ant-modal, .ant-select-dropdown, .ant-dropdown, .ant-popover'))
		);
	};

	handleEditorShortcutKeyDown = event => {
		const handler = this.canvasRef?.handler;
		const wrapperEl = this.canvasRef?.canvas?.wrapperEl;
		if (!handler || !wrapperEl || wrapperEl === document.activeElement || this.shouldIgnoreEditorShortcut(event)) {
			return;
		}

		const key = event.key ? event.key.toLowerCase() : '';
		const isMeta = event.ctrlKey || event.metaKey;

		if (isMeta && key === 'z') {
			event.preventDefault();
			handler.transactionHandler.undo();
			this.focusCanvas();
			return;
		}
		if ((isMeta && key === 'y') || (isMeta && event.shiftKey && key === 'z')) {
			event.preventDefault();
			handler.transactionHandler.redo();
			this.focusCanvas();
			return;
		}
		if (isMeta && key === 'a') {
			event.preventDefault();
			handler.selectAll();
			this.focusCanvas();
			return;
		}
		if (isMeta && key === 'c') {
			event.preventDefault();
			handler.copy();
			this.focusCanvas();
			return;
		}
		if (isMeta && key === 'x') {
			event.preventDefault();
			handler.cut();
			this.focusCanvas();
			return;
		}
		if (isMeta && key === 'v') {
			event.preventDefault();
			handler.paste();
			this.focusCanvas();
			return;
		}
		if (key === 'delete' || key === 'backspace') {
			event.preventDefault();
			handler.remove();
			this.focusCanvas();
			return;
		}
		if (key === 'escape') {
			handler.canvas.discardActiveObject();
			handler.canvas.requestRenderAll();
			this.canvasHandlers.onSelect(null);
			this.focusCanvas();
			return;
		}
		if (key === 'q') {
			event.preventDefault();
			handler.interactionHandler.selection();
			this.focusCanvas();
			return;
		}
		if (key === 'w') {
			event.preventDefault();
			handler.interactionHandler.grab();
			this.focusCanvas();
			return;
		}
		if (event.code === 'Space') {
			event.preventDefault();
			if (!event.repeat) {
				this.temporaryPanWasGrab = handler.interactionMode === 'grab';
			}
			handler.interactionHandler.grab();
			this.focusCanvas();
			return;
		}
		if (key === '+' || key === '=') {
			event.preventDefault();
			handler.zoomHandler.zoomIn();
			this.focusCanvas();
			return;
		}
		if (key === '-' || key === '_') {
			event.preventDefault();
			handler.zoomHandler.zoomOut();
			this.focusCanvas();
			return;
		}
		if (key === 'o') {
			event.preventDefault();
			handler.zoomHandler.zoomOneToOne();
			this.focusCanvas();
			return;
		}
		if (key === 'p') {
			event.preventDefault();
			handler.zoomHandler.zoomToFit();
			this.focusCanvas();
		}
	};

	handleEditorShortcutKeyUp = event => {
		const handler = this.canvasRef?.handler;
		const wrapperEl = this.canvasRef?.canvas?.wrapperEl;
		if (!handler || !wrapperEl || wrapperEl === document.activeElement || this.shouldIgnoreEditorShortcut(event)) {
			return;
		}
		if (event.code !== 'Space') {
			return;
		}
		event.preventDefault();
		if (!this.temporaryPanWasGrab) {
			handler.interactionHandler.selection();
		}
		this.temporaryPanWasGrab = false;
		this.focusCanvas();
	};

	createTemplate = async data => {
		if (!this.canvasRef?.handler || !this.canvasRef?.canvas) {
			this.setState({
				loading: false,
				errorMessage: 'Canvas is still loading. Refresh and try again if this continues.',
				successMessage: '',
			});
			return;
		}
		if (!data?.accessToken) {
			this.setState({
				loading: false,
				errorMessage: 'Designer session unavailable.',
				successMessage: '',
			});
			return;
		}
		const { designCode, isAdminPath, isCertificatePath, isBadgePath, isAdminBadgePath } = this.state;
		const accessToken = data.accessToken;
		const pageSize = this.state.selectedPageSize;
		const name = this.normalizeDesignName(this.state.inputData);
		if (isCertificatePath) {
			this.canvasHandlers.onChangeWokarea('backgroundColor', '#FFFFFF', '');
			this.canvasHandlers.onChangeWokarea('src', '', '');
		} else {
			this.canvasHandlers.onChangeWokarea('backgroundColor', '', '');
			this.canvasHandlers.onChangeWokarea('src', '', '');
		}
		let option = { name: 'New Image', format: 'png', quality: 1 };
		const dataURL = this.getCanvasImageDataUrl(option);

		if (isBadgePath) {
			this.canvasHandlers.onChangeWokarea('backgroundColor', '', '');
			this.canvasHandlers.onChangeWokarea('src', './images/sample/transparentBg.png', '');
		}

		const blob = this.dataUrlToBlob(dataURL);
			const objects = this.canvasRef.handler.exportJSON().filter(obj => {
				if (!obj.id) {
					return false;
				}
				return true;
			});

			// remove bg
			objects.shift();

			if (isCertificatePath) {
				if (pageSize === 'a4landscape') {
					objects.unshift(CONSTANTS.JSON_CONSTANT.LANDSCAPE_CERTIFICATE);
				} else {
					objects.unshift(CONSTANTS.JSON_CONSTANT.PORTRAIT_CERTIFICATE);
				}
			}

			const badgeAttribute = isAdminBadgePath && objects.some(obj => obj.name === 'attribute');
			const { animations, styles, dataSources } = this.state;
			const exportDatas = {
				objects,
				animations,
				styles,
				dataSources,
			};
			const templateCode = JSON.stringify(exportDatas, null, '\t');

			const formData = new FormData();
			formData.append('image', blob, 'image.png');
			formData.append('name', name);
			formData.append('pageSize', pageSize);
			formData.append('designCode', designCode);

			if (isAdminPath) {
				formData.append('templateCode', templateCode);
				if (isBadgePath) {
					formData.append('type', badgeAttribute ? 'template' : 'background');
				}
			} else {
				formData.append('jsonCode', templateCode);
			}

			this.setState({ loading: true });

			let endpoint;

			if (isAdminPath) {
				endpoint = isCertificatePath
					? '/templates/createcertificateTemplate'
					: '/templates/createBadgeTemplate';
			} else {
				endpoint = isCertificatePath
					? '/templates/saveCertificateDesign'
					: '/templates/saveBadgeDesign';
			}

			try {
				const responseData = await fetchDesignerJson(endpoint, {
					method: 'POST',
					headers: authHeaders(accessToken),
					body: formData,
				});

				const successMessage = `${isCertificatePath ? 'Certificate template' : 'Badge template'} created!`;
				const savedName = this.normalizeDesignName(isAdminPath ? responseData.TemplateName : responseData.name);
				this.setState({
					successMessage,
					successMessageVisible: true,
					createTemplateCalled: true,
					autoSaveId: responseData.id,
					inputData: savedName,
					isInputEmpty: savedName === '',
				});

				this.clearSuccessMessageTimer = setTimeout(() => {
					this.setState({
						successMessage: '',
						successMessageVisible: false,
					});
				}, 10000);
			} catch (error) {
				const errorMessage = `Failed to create ${isCertificatePath ? 'certificate' : 'badge'}`;
				this.setState({
					successMessage: '',
					errorMessage,
				});
				message.error(errorMessage);
			} finally {
				this.setState({ loading: false });
			}
	};

	editTemplate = async editType => {
		if (this.saveInFlight) {
			return;
		}
		if (!this.canvasRef?.handler || !this.canvasRef?.canvas) {
			if (editType === 'click') {
				message.error('Canvas is still loading. Try again in a moment.');
			}
			return;
		}
		if (!this.state.userData?.accessToken) {
			if (editType === 'click') {
				message.error('Designer session expired. Refresh and try again.');
			}
			return;
		}
		const pendingEditId = this.state.isEdit ? this.state.editId : this.state.autoSaveId;
		if (!pendingEditId) {
			if (editType === 'click') {
				message.error('Save is not ready yet. Try again in a moment.');
			}
			return;
		}
		if (editType === 'click' && !this.validateDesignName()) {
			return;
		}
		if (editType === 'click') {
			const { blockingIssues } = this.runDesignProofValidation();
			if (blockingIssues.length > 0) {
				return;
			}
		}
		this.saveInFlight = true;

		const designCode = this.state.designCode;
		const isAdminPath = this.state.isAdminPath;
		const isCertificatePath = this.state.isCertificatePath;
		const isEdit = this.state.isEdit;
		const isBadgePath = this.state.isBadgePath;
		const accessToken = this.state.userData.accessToken;
		const editId = pendingEditId;
		const credId = this.state.credId;
		const badgeId = this.state.badgeId;
		const certId = this.state.certId;
		const pageSize = this.state.selectedPageSize;
		const isDesignTemplate = this.state.isDesignTemplate;
		const isAdminBadgePath = this.state.isAdminBadgePath;
		const skip = this.state.skip;
		const saveRevision = this.editRevision;

		if (isBadgePath) {
			this.canvasHandlers.onChangeWokarea('backgroundColor', '', '');
			this.canvasHandlers.onChangeWokarea('src', '', '');
		}

		let option = { name: 'New Image', format: 'png', quality: 1 };
		const { left, top } = this.canvasRef.handler.workarea;
		const dataURL = this.getCanvasImageDataUrl(option);

		if (isBadgePath) {
			this.canvasHandlers.onChangeWokarea('backgroundColor', '', '');
			this.canvasHandlers.onChangeWokarea('src', './images/sample/transparentBg.png', '');
		}
		const blob = this.dataUrlToBlob(dataURL);
			const name = this.normalizeDesignName(this.state.inputData);
			const objects = this.canvasRef.handler.exportJSON().filter(obj => {
				if (!obj.id) {
					return false;
				}
				return true;
			});

			// remove bg
			objects.shift();
			objects.forEach(obj => {
				if (obj.id === 'workarea') {
					return;
				}
				obj.left -= left;
				obj.top -= top;
			});

			if (isCertificatePath) {
				if (pageSize === 'a4landscape') {
					objects.unshift(CONSTANTS.JSON_CONSTANT.LANDSCAPE_CERTIFICATE);
				} else {
					objects.unshift(CONSTANTS.JSON_CONSTANT.PORTRAIT_CERTIFICATE);
				}
			}

			const badgeAttribute = isAdminBadgePath && objects.some(obj => obj.name === 'attribute');
			const { animations, styles, dataSources } = this.state;
			const exportDatas = {
				objects,
				animations,
				styles,
				dataSources,
			};
			const templateCode = JSON.stringify(exportDatas, null, '\t');

			const formData = new FormData();
			formData.append('image', blob, 'image.png');
			formData.append('name', name);
			formData.append('pageSize', pageSize);
			formData.append('designCode', designCode);

			if (isAdminPath) {
				formData.append('templateCode', templateCode);
				if (isBadgePath) {
					formData.append('type', badgeAttribute ? 'template' : 'background');
				}
			} else {
				formData.append('jsonCode', templateCode);
			}
			let endpoint;

			if (isAdminPath) {
				endpoint = isCertificatePath
					? `/templates/editCertificateTemplate/${editId}`
					: `/templates/editBadgeTemplate/${editId}`;
			} else {
				endpoint = isCertificatePath
					? `/templates/editCertificateDesign/${editId}`
					: `/templates/editBadgeDesign/${editId}`;
			}
			if (editType === 'click') {
				this.setState({ isSaving: true });
			}

			try {
				const data = await fetchDesignerJson(endpoint, {
					method: 'PATCH',
					headers: authHeaders(accessToken),
					body: formData,
				});

				let successMessage = '';

				if (editType === 'autoSave') {
					successMessage = `${isCertificatePath ? 'Certificate' : 'Badge'} template autosaved!`;
				} else {
					successMessage = `${
						isEdit ? 'Template updated' : isCertificatePath ? 'Certificate template' : 'Badge template'
					} ${isEdit ? 'successfully!' : 'created!'}`;
					message.success(successMessage);
				}
				const updatedName = this.normalizeDesignName(data.name);
				const nextState = {
					successMessage,
					successMessageVisible: true,
					skip: 0,
					inputData: updatedName,
					isInputEmpty: updatedName === '',
				};

				if (this.editRevision === saveRevision) {
					nextState.editing = false;
				}

				this.setState(nextState);

				const url = new URL(window.location.href);
				url.searchParams.set('sk', 0);
				window.history.pushState({}, '', url);

				if (this.clearSuccessMessageTimer) {
					clearTimeout(this.clearSuccessMessageTimer);
				}
				this.clearSuccessMessageTimer = setTimeout(() => {
					this.setState({
						successMessage: '',
						successMessageVisible: false,
					});
				}, 10000);

				if (editType === 'click') {
					if (isAdminPath) {
						if (isCertificatePath) {
							window.location.href = `${
								CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL
							}/template-manager?type=certificate&pg=${pageSize === 'a4landscape' ? 'ls' : 'pt'}&sk=${0}`;
						} else if (isBadgePath) {
							window.location.href = `${CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL}/template-manager?type=badge&sk=${0}`;
						}
					} else if (isDesignTemplate) {
						if (isCertificatePath) {
							window.location.href = `${
								CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL
							}/template-designs?type=certificate&pg=${pageSize === 'a4landscape' ? 'ls' : 'pt'}`;
						} else if (isBadgePath) {
							window.location.href = `${CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL}/template-designs?type=badge`;
						}
					} else {
						if (isCertificatePath) {
							window.location.href = `${
								CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL
							}/credential-template?type=certificate&cid=${credId}&bid=${badgeId}&ctid=${certId}&design=true&pg=${
								pageSize === 'a4landscape' ? 'ls' : 'pt'
							}`;
						} else if (isBadgePath) {
							window.location.href = `${CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL}/credential-template?type=badge&cid=${credId}&bid=${badgeId}&ctid=${certId}&design=true`;
						}
					}
				}
			} catch (error) {
				const errorMessage =
					editType === 'autoSave'
						? `Failed to autosave ${isCertificatePath ? 'certificate' : 'badge'}`
						: `Failed to ${isEdit ? 'update' : 'create'} ${isCertificatePath ? 'certificate' : 'badge'}`;

				this.setState({
					successMessage: '',
					errorMessage,
				});

				if (editType === 'click') {
					message.error(errorMessage);
				}
			} finally {
				this.saveInFlight = false;
				if (editType === 'click') {
					this.setState({ isSaving: false });
				}
			}
	};

	canvasHandlers = {
		onAdd: target => {
			const { editing } = this.state;
			this.forceUpdate();
			if (!editing) {
				this.changeEditing(true);
			}
			if (target.type === 'activeSelection') {
				this.canvasHandlers.onSelect(null);
				return;
			}
			this.canvasRef.handler.select(target);
			this.canvasHandlers.onSelect(target);
		},
		onSelect: target => {
			const { selectedItem } = this.state;
			if (target && target.id && target.id !== 'workarea' && target.type !== 'activeSelection') {
				if (selectedItem && target.id === selectedItem.id) {
					return;
				}
				this.canvasRef.handler.getObjects().forEach(obj => {
					if (obj) {
						this.canvasRef.handler.animationHandler.resetAnimation(obj, true);
					}
				});
				this.setState({
					selectedItem: target,
				});
				return;
			}
			this.canvasRef.handler.getObjects().forEach(obj => {
				if (obj) {
					this.canvasRef.handler.animationHandler.resetAnimation(obj, true);
				}
			});
			this.setState({
				selectedItem: null,
			});
		},
		onRemove: () => {
			const { editing } = this.state;
			if (!editing) {
				this.changeEditing(true);
			}
			this.canvasHandlers.onSelect(null);
		},
		onModified: debounce(() => {
			const { editing } = this.state;
			this.forceUpdate();
			if (!editing) {
				this.changeEditing(true);
			}
		}, 300),
		onZoom: zoom => {
			this.setState({
				zoomRatio: zoom,
			});
		},
		onInteraction: interactionMode => {
			this.setState({ interactionMode });
		},
		onChange: (selectedItem, changedValues, allValues) => {
			const { editing } = this.state;
			if (!editing) {
				this.changeEditing(true);
			}
			const changedKey = Object.keys(changedValues)[0];
			const changedValue = changedValues[changedKey];
			if (allValues.workarea) {
				this.canvasHandlers.onChangeWokarea(changedKey, changedValue, allValues.workarea);
				return;
			}
			if (changedKey === 'width' || changedKey === 'height') {
				this.canvasRef.handler.scaleToResize(allValues.width, allValues.height);
				return;
			}
			if (changedKey === 'angle') {
				this.canvasRef.handler.rotate(allValues.angle);
				return;
			}
			if (changedKey === 'locked') {
				this.canvasRef.handler.setObject({
					lockMovementX: changedValue,
					lockMovementY: changedValue,
					hasControls: !changedValue,
					hoverCursor: changedValue ? 'pointer' : 'move',
					editable: !changedValue,
					locked: changedValue,
				});
				return;
			}
			if (changedKey === 'file' || changedKey === 'src' || changedKey === 'code') {
				if (selectedItem.type === 'image') {
					this.canvasRef.handler.setImageById(selectedItem.id, changedValue);
				} else if (selectedItem.superType === 'element') {
					this.canvasRef.handler.elementHandler.setById(selectedItem.id, changedValue);
				}
				return;
			}
			if (changedKey === 'link') {
				const link = Object.assign({}, defaultOption.link, allValues.link);
				this.canvasRef.handler.set(changedKey, link);
				return;
			}
			if (changedKey === 'tooltip') {
				const tooltip = Object.assign({}, defaultOption.tooltip, allValues.tooltip);
				this.canvasRef.handler.set(changedKey, tooltip);
				return;
			}
			if (changedKey === 'animation') {
				const animation = Object.assign({}, defaultOption.animation, allValues.animation);
				this.canvasRef.handler.set(changedKey, animation);
				return;
			}
			if (changedKey === 'icon') {
				const { unicode, styles } = changedValue[Object.keys(changedValue)[0]];
				const uni = parseInt(unicode, 16);
				if (styles[0] === 'brands') {
					this.canvasRef.handler.set('fontFamily', 'Font Awesome 5 Brands');
				} else if (styles[0] === 'regular') {
					this.canvasRef.handler.set('fontFamily', 'Font Awesome 5 Regular');
				} else {
					this.canvasRef.handler.set('fontFamily', 'Font Awesome 5 Free');
				}
				this.canvasRef.handler.set('text', String.fromCodePoint(uni));
				this.canvasRef.handler.set('icon', changedValue);
				return;
			}
			if (changedKey === 'shadow') {
				if (allValues.shadow.enabled) {
					if ('blur' in allValues.shadow) {
						this.canvasRef.handler.setShadow(allValues.shadow);
					} else {
						this.canvasRef.handler.setShadow({
							enabled: true,
							blur: 15,
							offsetX: 10,
							offsetY: 10,
						});
					}
				} else {
					this.canvasRef.handler.setShadow(null);
				}
				return;
			}
			if (changedKey === 'fontWeight') {
				this.canvasRef.handler.set(changedKey, changedValue ? 'bold' : 'normal');
				return;
			}
			if (changedKey === 'fontStyle') {
				this.canvasRef.handler.set(changedKey, changedValue ? 'italic' : 'normal');
				return;
			}
			if (changedKey === 'textAlign') {
				this.canvasRef.handler.set(changedKey, typeof changedValue === 'string' ? changedValue : Object.keys(changedValue)[0]);
				return;
			}
			if (changedKey === 'trigger') {
				const trigger = Object.assign({}, defaultOption.trigger, allValues.trigger);
				this.canvasRef.handler.set(changedKey, trigger);
				return;
			}
			if (changedKey === 'filters') {
				const filterKey = Object.keys(changedValue)[0];
				const filterValue = allValues.filters[filterKey];
				if (filterKey === 'gamma') {
					const rgb = [filterValue.r, filterValue.g, filterValue.b];
					this.canvasRef.handler.imageHandler.applyFilterByType(filterKey, changedValue[filterKey].enabled, {
						gamma: rgb,
					});
					return;
				}
				if (filterKey === 'brightness') {
					this.canvasRef.handler.imageHandler.applyFilterByType(filterKey, changedValue[filterKey].enabled, {
						brightness: filterValue.brightness,
					});
					return;
				}
				if (filterKey === 'contrast') {
					this.canvasRef.handler.imageHandler.applyFilterByType(filterKey, changedValue[filterKey].enabled, {
						contrast: filterValue.contrast,
					});
					return;
				}
				if (filterKey === 'saturation') {
					this.canvasRef.handler.imageHandler.applyFilterByType(filterKey, changedValue[filterKey].enabled, {
						saturation: filterValue.saturation,
					});
					return;
				}
				if (filterKey === 'hue') {
					this.canvasRef.handler.imageHandler.applyFilterByType(filterKey, changedValue[filterKey].enabled, {
						rotation: filterValue.rotation,
					});
					return;
				}
				if (filterKey === 'noise') {
					this.canvasRef.handler.imageHandler.applyFilterByType(filterKey, changedValue[filterKey].enabled, {
						noise: filterValue.noise,
					});
					return;
				}
				if (filterKey === 'pixelate') {
					this.canvasRef.handler.imageHandler.applyFilterByType(filterKey, changedValue[filterKey].enabled, {
						blocksize: filterValue.blocksize,
					});
					return;
				}
				if (filterKey === 'blur') {
					this.canvasRef.handler.imageHandler.applyFilterByType(filterKey, changedValue[filterKey].enabled, {
						value: filterValue.value,
					});
					return;
				}
				this.canvasRef.handler.imageHandler.applyFilterByType(filterKey, changedValue[filterKey]);
				return;
			}
			if (changedKey === 'chartOption') {
				try {
					const sandbox = new SandBox();
					const compiled = sandbox.compile(changedValue);
					if (!compiled) {
						message.error('Chart script contains unsupported or unsafe code.');
						return;
					}
					const { animations, styles } = this.state;
					const chartOption = compiled(3, animations, styles, selectedItem.userProperty);
					selectedItem.setChartOptionStr(changedValue);
					this.canvasRef.handler.elementHandler.setById(selectedItem.id, chartOption);
				} catch (error) {
					message.error('Unable to apply chart script.');
				}
				return;
			}
			this.canvasRef.handler.set(changedKey, changedValue);
		},
		onChangeWokarea: (changedKey, changedValue, allValues) => {
			if (changedKey === 'layout') {
				this.canvasRef.handler.workareaHandler.setLayout(changedValue);
				return;
			}
			if (changedKey === 'file' || changedKey === 'src') {
				this.canvasRef.handler.workareaHandler.setImage(changedValue);
				return;
			}
			if (changedKey === 'width' || changedKey === 'height') {
				this.canvasRef.handler.originScaleToResize(
					this.canvasRef.handler.workarea,
					allValues.width,
					allValues.height,
				);
				this.canvasRef.canvas.centerObject(this.canvasRef.handler.workarea);
				return;
			}
			this.canvasRef.handler.workarea.set(changedKey, changedValue);
			this.canvasRef.canvas.requestRenderAll();
		},
		onTooltip: (ref, target) => {
			const value = Math.random() * 10 + 1;
			return (
				<div>
					<div>
						<div>
							<Button>{target.id}</Button>
						</div>
						<Badge count={value} />
					</div>
				</div>
			);
		},
		onClick: (canvas, target) => {
			const { link } = target;
			if (link.state === 'current') {
				document.location.href = link.url;
				return;
			}
			window.open(link.url);
		},
		onContext: (ref, event, target) => {
			if ((target && target.id === 'workarea') || !target) {
				return null;
			}
			if (target.type === 'activeSelection') {
				return (
					<Menu>
						<Menu.Item
							onClick={() => {
								this.runContextCanvasAction(handler => handler.toGroup());
							}}
						>
							{i18n.t('action.object-group')}
						</Menu.Item>
						<Menu.Item
							onClick={() => {
								this.runContextCanvasAction(handler => handler.duplicate());
							}}
						>
							{i18n.t('action.clone')}
						</Menu.Item>
						<Menu.Item
							onClick={() => {
								this.runContextCanvasAction(handler => handler.remove());
							}}
						>
							{i18n.t('action.delete')}
						</Menu.Item>
					</Menu>
				);
			}
			if (target.type === 'group') {
				return (
					<Menu>
						<Menu.Item
							onClick={() => {
								this.runContextCanvasAction(handler => handler.toActiveSelection());
							}}
						>
							{i18n.t('action.object-ungroup')}
						</Menu.Item>
						<Menu.Item
							onClick={() => {
								this.runContextCanvasAction(handler => handler.duplicate());
							}}
						>
							{i18n.t('action.clone')}
						</Menu.Item>
						<Menu.Item
							onClick={() => {
								this.runContextCanvasAction(handler => handler.remove());
							}}
						>
							{i18n.t('action.delete')}
						</Menu.Item>
					</Menu>
				);
			}
			return (
				<Menu>
					<Menu.Item
						onClick={() => {
							this.runContextCanvasAction(handler => handler.duplicateById(target.id));
						}}
					>
						{i18n.t('action.clone')}
					</Menu.Item>
					<Menu.Item
						onClick={() => {
							this.runContextCanvasAction(handler => handler.removeById(target.id));
						}}
					>
						{i18n.t('action.delete')}
					</Menu.Item>
				</Menu>
			);
		},
		onTransaction: transaction => {
			if (!this.state.editing) {
				this.changeEditing(true);
			}
			this.syncSafeAreaOverlay();
			this.forceUpdate();
		},
	};

	handlers = {
		onChangePreview: checked => {
			let data;
			if (this.canvasRef) {
				data = this.canvasRef.handler.exportJSON().filter(obj => {
					if (!obj.id) {
						return false;
					}
					return true;
				});
			}
			this.setState({
				preview: typeof checked === 'object' ? false : checked,
				objects: data,
			});
		},
		onProgress: progress => {
			this.setState({
				progress,
			});
		},
		onImport: files => {
			if (files) {
				this.showLoading(true);
				setTimeout(() => {
					const reader = new FileReader();
					reader.onprogress = e => {
						if (e.lengthComputable) {
							const progress = parseInt((e.loaded / e.total) * 100, 10);
							this.handlers.onProgress(progress);
						}
					};
					reader.onload = e => {
						try {
							const { objects, animations = [], styles = [], dataSources = [] } = this.parseImportedDesign(
								e.target.result,
							);

							const importedObjects = this.state.isBadgePath
								? [CONSTANTS.JSON_CONSTANT.BADGE, ...objects]
								: objects;

							this.setState({
								animations,
								styles,
								dataSources,
							});

							this.canvasRef.handler.clear(true);
							const data = importedObjects.filter(obj => {
								if (!obj.id) {
									return false;
								}
								return true;
							});
							this.canvasRef.handler.importJSON(data).then(this.syncSafeAreaOverlay);
							this.setState({ editing: true, proofIssues: [] });
						} catch (error) {
							message.error(error.message || 'Unable to import design JSON.');
						}
					};
					reader.onloadend = () => {
						this.showLoading(false);
					};
					reader.onerror = () => {
						this.showLoading(false);
					};
					reader.readAsText(files[0]);
				}, 500);
			}
		},
		onUpload: () => {
			const inputEl = document.createElement('input');
			inputEl.accept = '.json';
			inputEl.type = 'file';
			inputEl.hidden = true;
			inputEl.onchange = e => {
				this.handlers.onImport(e.target.files);
			};
			document.body.appendChild(inputEl); // required for firefox
			inputEl.click();
			inputEl.remove();
		},
		onDownload: () => {
			this.showLoading(true);
			const objects = this.canvasRef.handler.exportJSON().filter(obj => {
				if (!obj.id) {
					return false;
				}
				return true;
			});

			// remove bg
			objects.shift();

			if (this.state.isCertificatePath) {
				if (this.state.selectedPageSize === 'a4landscape') {
					objects.unshift(CONSTANTS.JSON_CONSTANT.LANDSCAPE_CERTIFICATE);
				} else {
					objects.unshift(CONSTANTS.JSON_CONSTANT.PORTRAIT_CERTIFICATE);
				}
			}

			const { animations, styles, dataSources } = this.state;
			const exportDatas = {
				objects,
				animations,
				styles,
				dataSources,
			};
			const anchorEl = document.createElement('a');
			anchorEl.href = `data:text/json;charset=utf-8,${encodeURIComponent(
				JSON.stringify(exportDatas, null, '\t'),
			)}`;
			anchorEl.download = `${this.canvasRef.handler.workarea.name || 'sample'}.json`;
			document.body.appendChild(anchorEl);
			anchorEl.click();
			anchorEl.remove();
			this.showLoading(false);
		},
		onChangeAnimations: animations => {
			if (!this.state.editing) {
				this.changeEditing(true);
			}
			this.setState({
				animations,
			});
		},
		onChangeStyles: styles => {
			if (!this.state.editing) {
				this.changeEditing(true);
			}
			this.setState({
				styles,
			});
		},
		onChangeDataSources: dataSources => {
			if (!this.state.editing) {
				this.changeEditing(true);
			}
			this.setState({
				dataSources,
			});
		},
		onSaveImage: () => {
			const isBadgePath = this.state.isBadgePath;
			if (isBadgePath) {
				this.canvasHandlers.onChangeWokarea('backgroundColor', '', '');
				this.canvasHandlers.onChangeWokarea('src', '', '');
			}

			this.canvasRef.handler.saveCanvasImage();

			if (isBadgePath) {
				this.canvasHandlers.onChangeWokarea('backgroundColor', '', '');
				this.canvasHandlers.onChangeWokarea('src', './images/sample/transparentBg.png', '');
			}
		},

		onSaveImageAndJson: () => {
			this.editTemplate('click');
			// const successMessage = this.state.isEdit
			// 	? 'Template edited successfully!'
			// 	: 'Template created successfully!';
			// message.success(successMessage);
		},
	};

	transformList = () => {
		return Object.values(this.state.descriptors).reduce((prev, curr) => prev.concat(curr), []);
	};

	showLoading = loading => {
		this.setState({
			loading,
		});
	};

	changeEditing = editing => {
		if (editing) {
			this.editRevision += 1;
		}
		this.setState({
			editing,
		});
	};

	onChangeInput = e => {
		const inputData = e.target.value;
		const isInputEmpty = this.normalizeDesignName(inputData) === '';
		this.setState({
			inputData,
			isInputEmpty,
			errorMessage: isInputEmpty ? this.state.errorMessage : '',
		});
	};

	handlePageSizeChange = value => {
		const isCertificatePath = this.state.isCertificatePath;
		this.setState({ selectedPageSize: value });
		this.changeEditing(true);

		if (!this.canvasRef?.handler) {
			return;
		}


		if (isCertificatePath) {

			const objects = this.canvasRef.handler.exportJSON().filter(obj => {
				if (!obj.id) {
					return false;
				}
				return true;
			});
	
			objects.shift();

			if (value === 'a4landscape') {
				objects.unshift(CONSTANTS.JSON_CONSTANT.LANDSCAPE_CERTIFICATE);
			} else {
				objects.unshift(CONSTANTS.JSON_CONSTANT.PORTRAIT_CERTIFICATE);
			}

			this.canvasRef.handler.clear(true);

		if (Array.isArray(objects)) {
			this.canvasRef.handler.importJSON(objects).then(this.syncSafeAreaOverlay);
		} else {
			message.error('Unable to resize canvas because the current design data is invalid.');
		}
		}
	};

	handleToolbarClassUpdate = className => {
		this.setState({ toolbarClass: className });
	};

	handleCanvasChange = value => {
		if (value) {
			this.editRevision += 1;
		}
		this.setState({ editing: value });
	};

	handleCanvasAssetApplied = () => {
		this.syncSafeAreaOverlay();
		this.focusCanvas();
	};

	handleMainLoader = value => {
		this.setState({ loading: value });
	};

	handleBackButton = () => {
		if (this.state.isAdminPath) {
			if (this.state.isCertificatePath) {
				window.location.href = `${
					CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL
				}/template-manager?type=certificate&pg=${
					this.state.selectedPageSize === 'a4landscape' ? 'ls' : 'pt'
				}&sk=${this.state.skip}`;
			} else if (this.state.isBadgePath) {
				window.location.href = `${CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL}/template-manager?type=badge&sk=${this.state.skip}`;
			}
		} else if (this.state.isDesignTemplate) {
			if (this.state.isCertificatePath) {
				window.location.href = `${
					CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL
				}/template-designs?type=certificate&pg=${this.state.selectedPageSize === 'a4landscape' ? 'ls' : 'pt'}`;
			} else if (this.state.isBadgePath) {
				window.location.href = `${CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL}/template-designs?type=badge`;
			}
		} else {
			if (this.state.isCertificatePath) {
				window.location.href = `${
					CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL
				}/credential-template?type=certificate&cid=${this.state.credId}&bid=${this.state.badgeId}&ctid=${
					this.state.certId
				}&design=true&pg=${this.state.selectedPageSize === 'a4landscape' ? 'ls' : 'pt'}`;
			} else if (this.state.isBadgePath) {
				window.location.href = `${CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL}/credential-template?type=badge&cid=${this.state.credId}&bid=${this.state.badgeId}&ctid=${this.state.certId}&design=true`;
			}
		}
	};

	handlePreview = () => {
		const { blockingIssues } = this.runDesignProofValidation();
		if (blockingIssues.length > 0) {
			return;
		}

		let option = { name: 'New Image', format: 'png', quality: 1 };
		const dataUrl = this.getCanvasImageDataUrl(option);
		this.setState({
			previewVisible: true,
			previewImage: dataUrl,
		});
	};

	handleCancelPreview = () => {
		this.setState({
			previewVisible: false,
			previewImage: '',
		});
	};

	handleOpenProofIssues = () => {
		this.runDesignProofValidation({ showMessage: false });
		this.setState({ proofModalVisible: true });
	};

	handleCloseProofIssues = () => {
		this.setState({ proofModalVisible: false });
	};

	handleToggleGrid = () => {
		this.setState(
			prevState => ({ gridEnabled: !prevState.gridEnabled }),
			() => {
				this.canvasRef?.canvas?.requestRenderAll();
			},
		);
	};

	handleToggleSnap = () => {
		this.setState(prevState => ({
			snapToGrid: !prevState.snapToGrid,
			gridEnabled: prevState.snapToGrid ? prevState.gridEnabled : true,
		}));
	};

	handleToggleGuides = () => {
		this.setState(prevState => ({ guidesEnabled: !prevState.guidesEnabled }));
	};

	handleToggleRulers = () => {
		this.setState(prevState => ({ rulersEnabled: !prevState.rulersEnabled }));
	};

	handleToggleSafeArea = () => {
		this.setState(prevState => ({ safeAreaEnabled: !prevState.safeAreaEnabled }), this.syncSafeAreaOverlay);
	};

	parseImportedDesign = rawJson => {
		let parsedDesign;

		try {
			parsedDesign = JSON.parse(rawJson);
		} catch (error) {
			throw new Error('The selected JSON file is not valid.');
		}

		if (!parsedDesign || !Array.isArray(parsedDesign.objects)) {
			throw new Error('The selected JSON file does not contain valid designer objects.');
		}

		return parsedDesign;
	};

	render() {
		const {
			preview,
			selectedItem,
			zoomRatio,
			loading,
			progress,
			animations,
			styles,
			dataSources,
			editing,
			descriptors,
			objects,
			isInputEmpty,
			inputData,
			selectedPageSize,
			currentPath,
			editId,
			isAdminPath,
			isBadgePath,
			isCertificatePath,
			userData,
			isSaving,
			isEdit,
			previewVisible,
			previewImage,
			toolbarClass,
			interactionMode,
			proofIssues,
			proofModalVisible,
			gridEnabled,
			snapToGrid,
			guidesEnabled,
			rulersEnabled,
			safeAreaEnabled,
		} = this.state;
		const saveBlockedByName = isInputEmpty;
		const saveTooltip = saveBlockedByName
			? 'Enter a design name to save and close.'
			: isSaving
			? 'Saving design...'
			: 'Save and close';
		const {
			onAdd,
			onRemove,
			onSelect,
			onModified,
			onChange,
			onZoom,
			onTooltip,
			onClick,
			onContext,
			onTransaction,
			onInteraction,
		} = this.canvasHandlers;
		const {
			onChangePreview,
			onDownload,
			onUpload,
			onChangeAnimations,
			onChangeStyles,
			onChangeDataSources,
			onSaveImage,
			onSaveImageAndJson,
		} = this.handlers;

		const canvasStyle = isBadgePath
			? { width: '600px', height: '600px' }
			: selectedPageSize === 'a4landscape'
			? {
					width: '800px',
					height: '618px',
					backgroundColor: '#FFFFFF',
					boxShadow: '2px 2px 16px 0px rgb(242,244,248)',
			  }
			: {
					width: '618px',
					height: '800px',
					backgroundColor: '#FFFFFF',
					boxShadow: '2px 2px 16px 0px rgb(242,244,248)',
			  };
		const rulerTicks = Array.from({ length: isBadgePath ? 7 : 9 }, (_, index) => index * 100);

		const action = (
			<React.Fragment>
				<Input
					placeholder="Enter a name"
					className="name-input"
					aria-invalid={saveBlockedByName}
					aria-label="Design name"
					onChange={this.onChangeInput}
					value={inputData}
				/>
				{!this.state.successMessage && !this.state.errorMessage && (
					<span className={`designer-save-state ${saveBlockedByName ? 'is-blocked' : editing ? 'is-dirty' : 'is-saved'}`}>
						<span />
						{saveBlockedByName ? 'Name required' : editing ? 'Unsaved' : 'Saved'}
					</span>
				)}
				{this.state.successMessage && !this.state.errorMessage && (
					<div className="org-txt">{this.state.successMessage}</div>
				)}
				{this.state.errorMessage && !this.state.successMessage && (
					<div className="err-txt">{this.state.errorMessage}</div>
				)}
				{proofIssues.length > 0 && !this.state.errorMessage && !this.state.successMessage && (
					<button
						type="button"
						className="warn-txt proof-status-btn"
						title={summarizeProofIssues(proofIssues)}
						onClick={this.handleOpenProofIssues}
					>
						Proof checks: {proofIssues.length} issue{proofIssues.length > 1 ? 's' : ''}
					</button>
				)}

				<button type="button" className="proof-action-btn" onClick={this.handleOpenProofIssues}>
					Proof
				</button>
				<CommonButton
					name="Save & Close"
					className="saveBtn"
					wrapperClassName="designer-save-action"
					onClick={onSaveImageAndJson}
					tooltipTitle={saveTooltip}
					tooltipPlacement="bottomRight"
					disabled={isSaving || isInputEmpty}
				/>
				{isAdminPath && (
					<div className="designer-admin-actions">
						<CommonButton
							className="rde-action-btn"
							shape="circle"
							icon="file-download"
							disabled={!editing && !isEdit}
							tooltipTitle={i18n.t('action.download')}
							onClick={onDownload}
							tooltipPlacement="bottomRight"
						/>
						{editing ? (
							<Popconfirm
								title={i18n.t('imagemap.imagemap-editing-confirm')}
								okText={i18n.t('action.ok')}
								cancelText={i18n.t('action.cancel')}
								onConfirm={onUpload}
								placement="bottomRight"
							>
								<CommonButton
									className="rde-action-btn"
									shape="circle"
									icon="file-upload"
									tooltipTitle={i18n.t('action.upload')}
									tooltipPlacement="bottomRight"
								/>
							</Popconfirm>
						) : (
							<CommonButton
								className="rde-action-btn"
								shape="circle"
								icon="file-upload"
								tooltipTitle={i18n.t('action.upload')}
								tooltipPlacement="bottomRight"
								onClick={onUpload}
							/>
						)}
						<CommonButton
							className="rde-action-btn"
							shape="circle"
							icon="image"
							tooltipTitle={i18n.t('action.image-save')}
							onClick={onSaveImage}
							tooltipPlacement="bottomRight"
						/>
					</div>
				)}
				<CommonButton
					className="rde-action-btn"
					shape="circle"
					icon="eye"
					tooltipTitle={i18n.t('action.preview')}
					onClick={this.handlePreview}
					tooltipPlacement="bottomRight"
				/>
			</React.Fragment>
		);
		const titleContent = (
			<React.Fragment>
				<CommonButton icon="arrow-left" onClick={this.handleBackButton} tooltipTitle="Back" />
				<span style={{ marginLeft: '10px' }}>SOLO {isBadgePath ? 'Badge' : 'Certificate'} Designer</span>
			</React.Fragment>
		);
		const title = <ImageMapTitle title={titleContent} action={action} />;
		const content = (
			<div className="rde-editor">
				{/* {loading && <Spin size="large" />} */}
				<ImageMapItems
					ref={c => {
						this.itemsRef = c;
					}}
					canvasRef={this.canvasRef}
					getCanvasRef={() => this.canvasRef}
					onFocusCanvas={this.focusCanvas}
					onApplyCanvasAsset={this.handleCanvasAssetApplied}
					descriptors={descriptors}
					onPageSizeChange={this.handlePageSizeChange}
					onCanvasChange={this.handleCanvasChange}
					mainLoader={this.handleMainLoader}
					userData={userData}
				/>
				<div className="rde-editor-main-panel">
					<div className="rde-editor-header-toolbar">
						<ImageMapHeaderToolbar
							canvasRef={this.canvasRef}
							selectedItem={selectedItem}
							onSelect={onSelect}
							onPageSizeChange={this.handlePageSizeChange}
							selectedPageSize={selectedPageSize}
							onClassNameUpdate={this.handleToolbarClassUpdate}
							onFocusCanvas={this.focusCanvas}
						/>
					</div>
					<div className="rde-editor-canvas-container">
						<div
							ref={c => {
								this.container = c;
							}}
							className="rde-editor-canvas"
							style={{ paddingBottom: '20px', paddingTop: '20px' }}
						>
							<div className="rde-artboard-meta">
								<span>{isBadgePath ? 'Badge' : 'Certificate'}</span>
								<span>
									{isBadgePath
										? 'Square canvas'
										: selectedPageSize === 'a4landscape'
										? 'A4 landscape'
										: 'A4 portrait'}
								</span>
								<span>Proof checks active</span>
							</div>
							{rulersEnabled && (
								<div className="rde-canvas-rulers" aria-hidden="true">
									<div className="rde-canvas-ruler-corner" />
									<div className="rde-canvas-ruler rde-canvas-ruler-top">
										{rulerTicks.map(tick => (
											<span key={`x-${tick}`}>{tick}</span>
										))}
									</div>
									<div className="rde-canvas-ruler rde-canvas-ruler-left">
										{rulerTicks.map(tick => (
											<span key={`y-${tick}`}>{tick}</span>
										))}
									</div>
								</div>
							)}
							<Canvas
								ref={c => {
									this.canvasRef = c;
								}}
								className="rde-canvas"
								minZoom={1}
								maxZoom={500}
								objectOption={defaultOption}
								propertiesToInclude={propertiesToInclude}
								onModified={onModified}
								onAdd={onAdd}
								onRemove={onRemove}
								onSelect={onSelect}
								onZoom={onZoom}
								onLoad={this.handleCanvasLoad}
								onTooltip={onTooltip}
								onClick={onClick}
								onContext={onContext}
								onTransaction={onTransaction}
								onInteraction={onInteraction}
								keyEvent={{
									transaction: true,
								}}
								gridOption={{
									enabled: gridEnabled,
									grid: 10,
									snapToGrid,
									lineColor: 'rgba(255, 108, 54, 0.13)',
									borderColor: 'rgba(255, 108, 54, 0.28)',
								}}
								guidelineOption={{
									enabled: guidesEnabled,
								}}
								canvasOption={{
									selectionColor: 'rgba(255, 136, 94, 0.3)',
								}}
								style={{
									marginTop: '30px',
									//left: '50%',
									//transform: 'translate(-50%, 0)',
									//position: 'relative',
									marginBottom: '70px',
									//...canvasStyle,
								}}

								// style={{width:'800px',height:'618px', top:'50%',left:'50%',transform:'translate(-50%,-50%'}}
							/>
						</div>
						<div className="rde-editor-footer-toolbar">
							<ImageMapFooterToolbar
								canvasRef={this.canvasRef}
								preview={preview}
								onChangePreview={onChangePreview}
								zoomRatio={zoomRatio}
								gridEnabled={gridEnabled}
								snapToGrid={snapToGrid}
								guidesEnabled={guidesEnabled}
								rulersEnabled={rulersEnabled}
								safeAreaEnabled={safeAreaEnabled}
								interactionMode={interactionMode}
								onFocusCanvas={this.focusCanvas}
								onToggleGrid={this.handleToggleGrid}
								onToggleSnap={this.handleToggleSnap}
								onToggleGuides={this.handleToggleGuides}
								onToggleRulers={this.handleToggleRulers}
								onToggleSafeArea={this.handleToggleSafeArea}
							/>
						</div>
					</div>
				</div>
				<ImageMapConfigurations
					canvasRef={this.canvasRef}
					onChange={onChange}
					selectedItem={selectedItem}
					onChangeAnimations={onChangeAnimations}
					onChangeStyles={onChangeStyles}
					onChangeDataSources={onChangeDataSources}
					animations={animations}
					styles={styles}
					dataSources={dataSources}
					toolbarClass={toolbarClass}
				/>
				<ImageMapPreview
					preview={preview}
					onChangePreview={onChangePreview}
					onTooltip={onTooltip}
					onClick={onClick}
					objects={objects}
				/>
			</div>
		);
		const previewModal = (
			<Modal
				title="Preview"
				visible={this.state.previewVisible}
				className="designer-preview-modal"
				footer={[
					<Button key="close" className="saveBtn" onClick={this.handleCancelPreview}>
						Close
					</Button>,
				]}
				onCancel={this.handleCancelPreview}
			>
				<img alt="Preview" className="previewPop-Img" src={this.state.previewImage} />
			</Modal>
		);
		const proofModal = (
			<Modal
				title="Proof Checks"
				visible={proofModalVisible}
				className="designer-proof-modal"
				footer={[
					<Button key="close" className="saveBtn" onClick={this.handleCloseProofIssues}>
						Close
					</Button>,
				]}
				onCancel={this.handleCloseProofIssues}
			>
				{proofIssues.length > 0 ? (
					<ul className="proof-issue-list">
						{proofIssues.map((issue, index) => (
							<li key={`${issue.message}-${index}`} className={`proof-issue-list-item proof-${issue.severity}`}>
								{issue.message}
							</li>
						))}
					</ul>
				) : (
					<div className="proof-pass-state" role="status">
						<div className="proof-pass-state-icon">OK</div>
						<div>
							<div className="proof-pass-state-title">No proof issues found</div>
							<div className="proof-pass-state-copy">
								The current design passes safe-area, variable, overflow, and scan-size checks.
							</div>
						</div>
					</div>
				)}
			</Modal>
		);
		return (
			<React.Fragment>
				<Content title={title} content={content} loading={loading} previewModal={previewModal} className="" />
				{proofModal}
			</React.Fragment>
		);
	}
}

export default ImageMapEditor;
