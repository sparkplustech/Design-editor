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
import { authHeaders, fetchDesignerJson, getCanvasObjects, loadDesignerSession } from '../../utils/designerApi';
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
		toolbarClass: 'minimize',
		skip: 0,
		proofIssues: [],
		proofModalVisible: false,
	};

	getExportMultiplier = () => 2;

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

	getCanvasImageDataUrl = option => {
		const cachedViewportTransform = this.canvasRef.canvas.viewportTransform;
		let { left, top, width, height, scaleX, scaleY } = this.canvasRef.handler.workarea;
		width = Math.ceil(width * scaleX);
		height = Math.ceil(height * scaleY);
		this.canvasRef.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];

		try {
			return this.canvasRef.canvas.toDataURL({
				...option,
				left,
				top,
				width,
				height,
				multiplier: this.getExportMultiplier(),
				enableRetinaScaling: true,
			});
		} finally {
			this.canvasRef.canvas.viewportTransform = cachedViewportTransform;
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
		this.showLoading(true);
		import('./Descriptors.json').then(descriptors => {
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
					setTimeout(() => {
						this.canvasRef.handler.importJSON(importObjects);
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
				message.error('Unable to load the selected design.');
				this.setState({ loading: false });
			}
		};

		loadDesignerSession()
			.then(data => {
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
			.catch(() => {
				message.error('Unable to start designer session.');
				this.setState({ loading: false });
			});

		this.autoSave = setInterval(() => {
			if (this.state.createTemplateCalled) {
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
		clearInterval(this.autoSave);
		clearTimeout(this.clearSuccessMessageTimer);
	}

	createTemplate = async data => {
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
		const editId = isEdit ? this.state.editId : this.state.autoSaveId;
		const credId = this.state.credId;
		const badgeId = this.state.badgeId;
		const certId = this.state.certId;
		const pageSize = this.state.selectedPageSize;
		const isDesignTemplate = this.state.isDesignTemplate;
		const isAdminBadgePath = this.state.isAdminBadgePath;
		const skip = this.state.skip;

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
				this.setState({
					successMessage,
					successMessageVisible: true,
					skip: 0,
					inputData: updatedName,
					isInputEmpty: updatedName === '',
				});

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
				this.canvasRef.handler.set(changedKey, Object.keys(changedValue)[0]);
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
				const { layerX: left, layerY: top } = event;
				return (
					// <Menu>
					// 	<Menu.SubMenu key="add" style={{ width: 120 }} title={i18n.t('action.add')}>
					// 		{this.transformList().map(item => {
					// 			const option = Object.assign({}, item.option, { left, top });
					// 			const newItem = Object.assign({}, item, { option });
					// 			return (
					// 				<Menu.Item style={{ padding: 0 }} key={item.name}>
					// 					{this.itemsRef.renderItem(newItem, false)}
					// 				</Menu.Item>
					// 			);
					// 		})}
					// 	</Menu.SubMenu>
					// </Menu>
					null
				);
			}
			if (target.type === 'activeSelection') {
				return (
					<Menu>
						<Menu.Item
							onClick={() => {
								this.canvasRef.handler.toGroup();
							}}
						>
							{i18n.t('action.object-group')}
						</Menu.Item>
						<Menu.Item
							onClick={() => {
								this.canvasRef.handler.duplicate();
							}}
						>
							{i18n.t('action.clone')}
						</Menu.Item>
						<Menu.Item
							onClick={() => {
								this.canvasRef.handler.remove();
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
								this.canvasRef.handler.toActiveSelection();
							}}
						>
							{i18n.t('action.object-ungroup')}
						</Menu.Item>
						<Menu.Item
							onClick={() => {
								this.canvasRef.handler.duplicate();
							}}
						>
							{i18n.t('action.clone')}
						</Menu.Item>
						<Menu.Item
							onClick={() => {
								this.canvasRef.handler.remove();
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
							this.canvasRef.handler.duplicateById(target.id);
						}}
					>
						{i18n.t('action.clone')}
					</Menu.Item>
					<Menu.Item
						onClick={() => {
							this.canvasRef.handler.removeById(target.id);
						}}
					>
						{i18n.t('action.delete')}
					</Menu.Item>
				</Menu>
			);
		},
		onTransaction: transaction => {
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
							this.canvasRef.handler.importJSON(data);
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
			this.canvasRef.handler.importJSON(objects);
		} else {
			message.error('Unable to resize canvas because the current design data is invalid.');
		}
		}
	};

	handleToolbarClassUpdate = className => {
		this.setState({ toolbarClass: className });
	};

	handleCanvasChange = value => {
		this.setState({ editing: value });
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
		const { proofIssues } = this.runDesignProofValidation({ showMessage: false });

		if (!proofIssues.length) {
			message.success('Proof checks passed.');
			return;
		}

		this.setState({ proofModalVisible: true });
	};

	handleCloseProofIssues = () => {
		this.setState({ proofModalVisible: false });
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
			proofIssues,
			proofModalVisible,
		} = this.state;
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

		const action = (
			<React.Fragment>
				<Input
					placeholder="Enter a name"
					className="name-input"
					onChange={this.onChangeInput}
					value={inputData}
				/>
				{!this.state.successMessage && !this.state.errorMessage && (
					<span className={`text-width ${!editing ? 'text-opa' : ''}`}>You have unsaved changes</span>
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

				<CommonButton
					name="Save & Close"
					className="saveBtn"
					onClick={onSaveImageAndJson}
					disabled={isSaving || isInputEmpty}
				/>
				{isAdminPath && (
					<div>
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
				<CommonButton icon="arrow-left" onClick={this.handleBackButton} />
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
					descriptors={descriptors}
					onPageSizeChange={this.handlePageSizeChange}
					onCanvasChange={this.handleCanvasChange}
					mainLoader={this.handleMainLoader}
					userData={userData}
				/>
				<div style={{ display: 'flex', flexDirection: 'column', flex: '1' }}>
					<div className="rde-editor-header-toolbar">
						<ImageMapHeaderToolbar
							canvasRef={this.canvasRef}
							selectedItem={selectedItem}
							onSelect={onSelect}
							onPageSizeChange={this.handlePageSizeChange}
							selectedPageSize={selectedPageSize}
							onClassNameUpdate={this.handleToolbarClassUpdate}
						/>
					</div>
					<div className="rde-editor-canvas-container" style={{ overflow: 'scroll', minWidth: '200px' }}>
						<div
							ref={c => {
								this.container = c;
							}}
							className="rde-editor-canvas"
							style={{ paddingBottom: '20px', paddingTop: '20px' }}
						>
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
								onTooltip={onTooltip}
								onClick={onClick}
								onContext={onContext}
								onTransaction={onTransaction}
								keyEvent={{
									transaction: true,
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
						<div
							className="rde-editor-footer-toolbar"
							style={{ position: 'fixed', width: '400px', bottom: '-5px' }}
						>
							<ImageMapFooterToolbar
								canvasRef={this.canvasRef}
								preview={preview}
								onChangePreview={onChangePreview}
								zoomRatio={zoomRatio}
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
				footer={[
					<Button key="close" className="saveBtn" onClick={this.handleCloseProofIssues}>
						Close
					</Button>,
				]}
				onCancel={this.handleCloseProofIssues}
			>
				<ul className="proof-issue-list">
					{proofIssues.map((issue, index) => (
						<li key={`${issue.message}-${index}`} className={`proof-issue-list-item proof-${issue.severity}`}>
							{issue.message}
						</li>
					))}
				</ul>
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
