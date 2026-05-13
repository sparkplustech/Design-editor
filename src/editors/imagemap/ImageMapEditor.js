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
		renderCompareLoading: false,
		renderCompareVisible: false,
		renderCompareResult: null,
		renderCompareError: '',
		toolbarClass: 'minimize',
		skip: 0,
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

		const queryParams = new URLSearchParams(window.location.search);
		const designCode = queryParams.get('designCode');
		//for badge

		const currentPath = window.location.pathname;
		const isAdminPath = currentPath.includes('admin');
		const isCertificatePath = currentPath.includes('certificate-designer');
		const isBadgePath = currentPath.includes('badge-designer');
		const isAdminBadgePath = currentPath.includes('admin-badge-designer');
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

		//edit

		const isEdit = queryParams.get('edit') === 'true';
		const id = queryParams.get('id');
		const credId = queryParams.get('cid');
		const badgeId = queryParams.get('bid');
		const certId = queryParams.get('ctid');
		const isDesignTemplate = queryParams.get('dt') === 'true';
		const skip = queryParams.get('sk');

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

		const handleFetch = (accessToken, isBadgePath, id) => {
			this.setState({ loading: true, createTemplateCalled: true });
			const templateEndpoint = isAdminPath
				? isBadgePath
					? `${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getBadgeTemplate/${id}`
					: `${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getCertificateTemplate/${id}`
				: isBadgePath
				? `${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getUserBadgeTemplate/${id}`
				: `${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getUserCertificateTemplate/${id}`;

			fetch(templateEndpoint, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			})
				.then(response => response.json())
				.then(data => {
					if (data.statusCode === 400) {
						queryParams.delete('id');
						queryParams.delete('edit');
						const newUrl = `${window.location.pathname}?designCode=${designCode}`;
						window.history.replaceState({}, '', newUrl);
						this.setState({ loading: false, inputData: '', isInputEmpty: false, editId: '' });
					} else {
						if (data?.templateCode !== '') {
							const objects = data?.templateCode?.objects;
							const pageSize = data?.pageSize;
							this.canvasRef.handler.clear(true);
							if (this.state.isBadgePath) {
								objects.unshift(CONSTANTS.JSON_CONSTANT.BADGE);
							}
							if (objects && Array.isArray(objects)) {
								setTimeout(() => {
									this.canvasRef.handler.importJSON(objects);
								}, 50);
							} else {
								console.error('Invalid objects data format:', objects);
							}
						}
						this.setState({
							loading: false,
							inputData: data?.name === null || data?.name === 'null' ? '' : data?.name,
							isInputEmpty: false,
							selectedPageSize: data?.pageSize,
						});
					}
				})
				.catch(error => console.error('Error fetching templates:', error));
		};

		fetch(`${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getusertoken/${designCode}`, {
			headers: {},
		})
			.then(response => response.json())
			.then(data => {
				this.setState({ userData: data });
				// console.log("check data", data);
				if (data.designId !== null) {
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
			.catch(error => console.error('Error fetching usertoken:', error));

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

	createTemplate = data => {
		const queryParams = new URLSearchParams(window.location.search);
		const designCode = queryParams.get('designCode');
		const currentPath = window.location.pathname;
		const isAdminPath = currentPath.includes('admin');
		const isCertificatePath = currentPath.includes('certificate-designer');
		const isBadgePath = currentPath.includes('badge-designer');
		const isAdminBadgePath = currentPath.includes('admin-badge-designer');
		const accessToken = data.accessToken;
		const pageSize = this.state.selectedPageSize;
		if (isCertificatePath) {
			this.canvasHandlers.onChangeWokarea('backgroundColor', '#FFFFFF', '');
			this.canvasHandlers.onChangeWokarea('src', '', '');
		} else {
			this.canvasHandlers.onChangeWokarea('backgroundColor', '', '');
			this.canvasHandlers.onChangeWokarea('src', '', '');
		}
		let option = { name: 'New Image', format: 'png', quality: 1 };
		let { left, top, width, height, scaleX, scaleY } = this.canvasRef.handler.workarea;
		width = Math.ceil(width * scaleX);
		height = Math.ceil(height * scaleY);
		// cachedVT is used to reset the viewportTransform after the image is saved.
		// reset the viewportTransform to default (no zoom)
		const cachedVT = this.canvasRef.canvas.viewportTransform;
		this.canvasRef.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
		const dataURL = this.canvasRef.canvas.toDataURL({
			...option,
			left,
			top,
			width,
			height,
			enableRetinaScaling: true,
			multiplier: 2,
		});
		this.canvasRef.canvas.viewportTransform = cachedVT;
		this.canvasRef.canvas.requestRenderAll();

		if (isBadgePath) {
			this.canvasHandlers.onChangeWokarea('backgroundColor', '', '');
			this.canvasHandlers.onChangeWokarea('src', './images/sample/transparentBg.png', '');
		}

		const blobPromise = fetch(dataURL).then(res => res.blob());
		blobPromise.then(blob => {
			const pageSize = this.state.selectedPageSize;
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
					? `${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/createcertificateTemplate`
					: `${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/createBadgeTemplate`;
			} else {
				endpoint = isCertificatePath
					? `${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/saveCertificateDesign`
					: `${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/saveBadgeDesign`;
			}

			fetch(endpoint, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				body: formData,
			})
				.then(response => {
					if (response.ok) {
						const successMessage = `${
							isCertificatePath ? 'Certificate template' : 'Badge template'
						} created!`;
						this.setState({
							successMessage: successMessage,
							successMessageVisible: true,
							createTemplateCalled: true,
						});

						this.clearSuccessMessageTimer = setTimeout(() => {
							this.setState({
								successMessage: '',
								successMessageVisible: false,
							});
						}, 10000);

						return response.json();
					} else {
						const errorMessage = `Failed to create ${isCertificatePath ? 'certificate' : 'badge'}`;
						this.setState({
							successMessage: '',
							errorMessage: errorMessage,
						});
						throw new Error('API Error');
					}
				})
				.then(data => {
					// console.log("check create data", data);
					this.setState({
						autoSaveId: data.id,
						inputData: isAdminPath ? data.TemplateName : data.name,
					});
					return data;
				})
				.catch(error => {
					console.error('API Error:', error);
					throw error;
				})
				.finally(() => {
					this.setState({ loading: false });
				});
		});
	};

	editTemplate = async editType => {
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
		let { left, top, width, height, scaleX, scaleY } = this.canvasRef.handler.workarea;
		width = Math.ceil(width * scaleX);
		height = Math.ceil(height * scaleY);
		const cachedVT = this.canvasRef.canvas.viewportTransform;
		this.canvasRef.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
		const dataURL = this.canvasRef.canvas.toDataURL({
			...option,
			left,
			top,
			width,
			height,
			enableRetinaScaling: true,
			multiplier: 2,
		});
		this.canvasRef.canvas.viewportTransform = cachedVT;
		this.canvasRef.canvas.requestRenderAll();

		if (isBadgePath) {
			this.canvasHandlers.onChangeWokarea('backgroundColor', '', '');
			this.canvasHandlers.onChangeWokarea('src', './images/sample/transparentBg.png', '');
		}
		const blobPromise = fetch(dataURL).then(res => res.blob());
		blobPromise.then(blob => {
			const name = this.state.inputData === null || this.state.inputData === 'null' ? '' : this.state.inputData;
			const pageSize = this.state.selectedPageSize;
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
			// console.log("template code", templateCode );
			let endpoint;

			if (isAdminPath) {
				endpoint = isCertificatePath
					? `${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/editCertificateTemplate/${editId}`
					: `${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/editBadgeTemplate/${editId}`;
			} else {
				endpoint = isCertificatePath
					? `${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/editCertificateDesign/${editId}`
					: `${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/editBadgeDesign/${editId}`;
			}
			if (editType === 'click') {
				this.setState({ isSaving: true });
			}
			fetch(endpoint, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				body: formData,
			})
				.then(response => {
					if (response.ok) {
						let successMessage = '';

						if (editType === 'autoSave') {
							successMessage = `${isCertificatePath ? 'Certificate' : 'Badge'} template autosaved!`;
						} else {
							successMessage = `${
								isEdit
									? 'Template updated'
									: isCertificatePath
									? 'Certificate template'
									: 'Badge template'
							} ${isEdit ? 'successfully!' : 'created!'}`;
							message.success(successMessage);
						}
						this.setState({
							successMessage,
							successMessageVisible: true,
							skip: 0,
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

						return response.json();
					} else {
						if (editType === 'autoSave') {
							const errorMessage = `Failed to autosave ${isCertificatePath ? 'certificate' : 'badge'}`;
							this.setState({
								successMessage: '',
								errorMessage: errorMessage,
							});
						} else {
							const errorMessage = `Failed to ${isEdit ? 'update' : 'create'} ${
								isCertificatePath ? 'certificate' : 'badge'
							}`;
							this.setState({
								successMessage: '',
								errorMessage: errorMessage,
								isSaving: false,
							});
						}
						throw new Error('API Error');
					}
				})

				.then(data => {
					if (editType === 'click') {
						if (isAdminPath) {
							if (isCertificatePath) {
								window.location.href = `${
									CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL
								}/template-manager?type=certificate&pg=${
									pageSize === 'a4landscape' ? 'ls' : 'pt'
								}&sk=${0}`;
							} else if (isBadgePath) {
								window.location.href = `${
									CONSTANTS.API_CONSTANT.REACT_APP_BASE_URL
								}/template-manager?type=badge&sk=${0}`;
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
					this.setState({
						inputData: data.name,
					});
					return data;
				})
				.catch(error => {
					console.error('API Error:', error);
					throw error;
				});
		});
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
					const { animations, styles } = this.state;
					const chartOption = compiled(3, animations, styles, selectedItem.userProperty);
					selectedItem.setChartOptionStr(changedValue);
					this.canvasRef.handler.elementHandler.setById(selectedItem.id, chartOption);
				} catch (error) {
					console.error(error);
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
						const { objects, animations, styles, dataSources } = JSON.parse(e.target.result);

						if (this.state.isBadgePath) {
							objects.unshift(CONSTANTS.JSON_CONSTANT.BADGE);
						}

						this.setState({
							animations,
							styles,
							dataSources,
						});
						if (objects) {
							this.canvasRef.handler.clear(true);
							const data = objects.filter(obj => {
								if (!obj.id) {
									return false;
								}
								return true;
							});
							this.canvasRef.handler.importJSON(data);
							this.setState({ editing: true });
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
		const isInputEmpty = inputData.trim() === '';
		this.setState({ inputData, isInputEmpty });
	};

	handlePageSizeChange = value => {
		const isCertificatePath = this.state.isCertificatePath;
		// console.log("check is certificate", isCertificatePath);
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

		if (objects && Array.isArray(objects)) {
			this.canvasRef.handler.importJSON(objects);
		} else {
			console.error('Invalid objects data format:', objects);
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
		console.log('check state', this.state);
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
		let option = { name: 'New Image', format: 'png', quality: 1 };
		let { left, top, width, height, scaleX, scaleY } = this.canvasRef.handler.workarea;
		width = Math.ceil(width * scaleX);
		height = Math.ceil(height * scaleY);
		const cachedVT = this.canvasRef.canvas.viewportTransform;
		this.canvasRef.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
		const dataUrl = this.canvasRef.canvas.toDataURL({
			...option,
			left,
			top,
			width,
			height,
			enableRetinaScaling: true,
			multiplier: 2,
		});
		this.canvasRef.canvas.viewportTransform = cachedVT;
		this.canvasRef.canvas.requestRenderAll();
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

	isRenderCompareEnabled = () => {
		const queryParams = new URLSearchParams(window.location.search);
		return queryParams.get('renderCompare') === 'true';
	};

	getRenderCompareApiBase = () => {
		const queryParams = new URLSearchParams(window.location.search);
		const overrideBase = queryParams.get('renderApiBase');
		const apiBase = overrideBase || 'http://localhost:3000';
		return (apiBase || '').replace(/\/$/, '');
	};

	waitForCanvasRender = async () => {
		if (document.fonts && document.fonts.ready) {
			await document.fonts.ready.catch(() => undefined);
		}
		this.canvasRef.canvas.getObjects().forEach(obj => {
			if (['textbox', 'i-text', 'text'].includes(obj.type)) {
				obj.set({
					objectCaching: false,
					dirty: true,
				});
				if (typeof obj.initDimensions === 'function') {
					obj.initDimensions();
				}
				if (typeof obj.setCoords === 'function') {
					obj.setCoords();
				}
			}
		});
		this.canvasRef.canvas.renderAll();
		await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	};

	getFrontendRenderDataUrl = async () => {
		await this.waitForCanvasRender();
		const option = { name: 'Frontend render', format: 'png', quality: 1 };
		let { left, top, width, height, scaleX, scaleY } = this.canvasRef.handler.workarea;
		width = Math.ceil(width * scaleX);
		height = Math.ceil(height * scaleY);
		const cachedVT = this.canvasRef.canvas.viewportTransform;
		try {
			this.canvasRef.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
			return this.canvasRef.canvas.toDataURL({
				...option,
				left,
				top,
				width,
				height,
				enableRetinaScaling: true,
				multiplier: 2,
			});
		} finally {
			this.canvasRef.canvas.viewportTransform = cachedVT;
			this.canvasRef.canvas.requestRenderAll();
		}
	};

	getStoredRenderPayload = () => {
		let { left, top } = this.canvasRef.handler.workarea;
		left = Number(left) || 0;
		top = Number(top) || 0;
		const exportedObjects = this.canvasRef.handler
			.exportJSON()
			.filter(obj => obj.id)
			.map(obj => JSON.parse(JSON.stringify(obj)));
		const exportedWorkarea = exportedObjects.find(obj => obj.id === 'workarea');
		const exportWidth =
			Number(exportedWorkarea?.width) * Number(exportedWorkarea?.scaleX || 1) ||
			Number(this.canvasRef.handler.workarea.width) * Number(this.canvasRef.handler.workarea.scaleX || 1);
		const exportHeight =
			Number(exportedWorkarea?.height) * Number(exportedWorkarea?.scaleY || 1) ||
			Number(this.canvasRef.handler.workarea.height) * Number(this.canvasRef.handler.workarea.scaleY || 1);
		const normalizedWorkarea = {
			...(exportedWorkarea ||
				(this.state.isBadgePath
					? CONSTANTS.JSON_CONSTANT.BADGE
					: this.state.selectedPageSize === 'a4portrait'
					? CONSTANTS.JSON_CONSTANT.PORTRAIT_CERTIFICATE
					: CONSTANTS.JSON_CONSTANT.LANDSCAPE_CERTIFICATE)),
			left: 0,
			top: 0,
			width: exportWidth,
			height: exportHeight,
			scaleX: 1,
			scaleY: 1,
			workareaWidth: exportWidth,
			workareaHeight: exportHeight,
		};

		const objects = exportedObjects.filter(obj => obj.id !== 'workarea');
		objects.forEach(obj => {
			if (typeof obj.left === 'number') {
				obj.left -= left;
			}
			if (typeof obj.top === 'number') {
				obj.top -= top;
			}
		});

		objects.unshift(normalizedWorkarea);

		return {
			objects,
			animations: this.state.animations,
			styles: this.state.styles,
			dataSources: this.state.dataSources,
		};
	};

	getApiRenderEndpoint = () => {
		const endpoint = this.state.isBadgePath ? 'json-to-badgeImage' : 'json-to-image';
		const apiBase = this.getRenderCompareApiBase();
		if (!apiBase) {
			throw new Error('Render API base URL is missing. Add renderApiBase to the URL.');
		}
		return `${apiBase}/puppeter-canvas/${endpoint}`;
	};

	normalizeApiImageDataUrl = responseBody => {
		const imageData = responseBody?.data?.buffer || responseBody?.data || responseBody?.buffer || responseBody;
		if (typeof imageData === 'string') {
			return imageData.startsWith('data:image') ? imageData : `data:image/png;base64,${imageData}`;
		}
		const bytes = imageData?.data || imageData;
		if (!Array.isArray(bytes)) {
			throw new Error('Backend response did not contain a PNG buffer.');
		}
		let binary = '';
		const chunkSize = 0x8000;
		for (let i = 0; i < bytes.length; i += chunkSize) {
			const chunk = bytes.slice(i, i + chunkSize);
			binary += String.fromCharCode.apply(null, chunk);
		}
		return `data:image/png;base64,${btoa(binary)}`;
	};

	loadCompareImage = dataUrl =>
		new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = reject;
			image.src = dataUrl;
		});

	compareRenderImages = async (frontendDataUrl, apiDataUrl) => {
		const [frontendImage, apiImage] = await Promise.all([
			this.loadCompareImage(frontendDataUrl),
			this.loadCompareImage(apiDataUrl),
		]);
		const frontendWidth = frontendImage.naturalWidth || frontendImage.width;
		const frontendHeight = frontendImage.naturalHeight || frontendImage.height;
		const apiWidth = apiImage.naturalWidth || apiImage.width;
		const apiHeight = apiImage.naturalHeight || apiImage.height;
		const width = Math.min(frontendWidth, apiWidth);
		const height = Math.min(frontendHeight, apiHeight);
		const frontendCanvas = document.createElement('canvas');
		const apiCanvas = document.createElement('canvas');
		const diffCanvas = document.createElement('canvas');
		frontendCanvas.width = apiCanvas.width = diffCanvas.width = width;
		frontendCanvas.height = apiCanvas.height = diffCanvas.height = height;

		const frontendCtx = frontendCanvas.getContext('2d');
		const apiCtx = apiCanvas.getContext('2d');
		const diffCtx = diffCanvas.getContext('2d');
		frontendCtx.drawImage(frontendImage, 0, 0);
		apiCtx.drawImage(apiImage, 0, 0);

		const frontendPixels = frontendCtx.getImageData(0, 0, width, height);
		const apiPixels = apiCtx.getImageData(0, 0, width, height);
		const diffPixels = diffCtx.createImageData(width, height);
		let strictDifferentPixels = 0;
		let visibleDifferentPixels = 0;
		let maxChannelDelta = 0;
		const visibleThreshold = 8;

		for (let i = 0; i < frontendPixels.data.length; i += 4) {
			const redDelta = Math.abs(frontendPixels.data[i] - apiPixels.data[i]);
			const greenDelta = Math.abs(frontendPixels.data[i + 1] - apiPixels.data[i + 1]);
			const blueDelta = Math.abs(frontendPixels.data[i + 2] - apiPixels.data[i + 2]);
			const alphaDelta = Math.abs(frontendPixels.data[i + 3] - apiPixels.data[i + 3]);
			const pixelDelta = Math.max(redDelta, greenDelta, blueDelta, alphaDelta);
			maxChannelDelta = Math.max(maxChannelDelta, pixelDelta);
			if (pixelDelta > 0) {
				strictDifferentPixels += 1;
			}
			if (pixelDelta > visibleThreshold) {
				visibleDifferentPixels += 1;
				diffPixels.data[i] = 255;
				diffPixels.data[i + 1] = 0;
				diffPixels.data[i + 2] = 0;
				diffPixels.data[i + 3] = 255;
			} else {
				diffPixels.data[i] = 255;
				diffPixels.data[i + 1] = 255;
				diffPixels.data[i + 2] = 255;
				diffPixels.data[i + 3] = 255;
			}
		}
		diffCtx.putImageData(diffPixels, 0, 0);

		return {
			frontendDimensions: `${frontendWidth} x ${frontendHeight}`,
			apiDimensions: `${apiWidth} x ${apiHeight}`,
			dimensionsMatch: frontendWidth === apiWidth && frontendHeight === apiHeight,
			strictDifferentPixels,
			visibleDifferentPixels,
			visibleDifferencePercent: width && height ? (visibleDifferentPixels / (width * height)) * 100 : 0,
			maxChannelDelta,
			diffDataUrl: diffCanvas.toDataURL('image/png'),
		};
	};

	handleRenderCompare = async () => {
		if (!this.canvasRef || !this.canvasRef.handler) {
			return;
		}
		this.setState({
			renderCompareLoading: true,
			renderCompareVisible: true,
			renderCompareResult: null,
			renderCompareError: '',
		});
		try {
			const frontendDataUrl = await this.getFrontendRenderDataUrl();
			const payload = this.getStoredRenderPayload();
			const endpoint = this.getApiRenderEndpoint();
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText || `Backend render failed with ${response.status}`);
			}
			const responseBody = await response.json();
			const apiDataUrl = this.normalizeApiImageDataUrl(responseBody);
			const comparison = await this.compareRenderImages(frontendDataUrl, apiDataUrl);
			this.setState({
				renderCompareResult: {
					endpoint,
					frontendDataUrl,
					apiDataUrl,
					...comparison,
				},
			});
		} catch (error) {
			this.setState({
				renderCompareError: error.message || String(error),
			});
		} finally {
			this.setState({
				renderCompareLoading: false,
			});
		}
	};

	handleRenderCompareCancel = () => {
		this.setState({
			renderCompareVisible: false,
		});
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
			renderCompareLoading,
			renderCompareVisible,
			renderCompareResult,
			renderCompareError,
			toolbarClass,
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

				{/* <span className='text-width'>No unsaved changes</span> */}
				<CommonButton
					name="Save & Close"
					className="saveBtn"
					onClick={onSaveImageAndJson}
					disabled={isSaving}
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
				{this.isRenderCompareEnabled() && (
					<CommonButton
						name="Compare API Render"
						className="rde-action-btn"
						loading={renderCompareLoading}
						onClick={this.handleRenderCompare}
						tooltipTitle="Compare frontend export with backend PNG"
						tooltipPlacement="bottomRight"
					/>
				)}
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
							style={{ paddingBottom: '20x', paddingTop: '20x' }}
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
		const renderCompareModal = (
			<Modal
				title="Frontend/API Render Compare"
				visible={renderCompareVisible}
				width={1180}
				footer={[
					<Button key="close" className="saveBtn" onClick={this.handleRenderCompareCancel}>
						Close
					</Button>,
				]}
				onCancel={this.handleRenderCompareCancel}
			>
				{renderCompareLoading && <Spin size="large" />}
				{renderCompareError && <div className="err-txt">{renderCompareError}</div>}
				{renderCompareResult && (
					<div>
						<div style={{ marginBottom: 12 }}>
							<div>
								<strong>Endpoint:</strong> {renderCompareResult.endpoint}
							</div>
							<div>
								<strong>Dimensions:</strong> frontend {renderCompareResult.frontendDimensions}, API{' '}
								{renderCompareResult.apiDimensions}{' '}
								{renderCompareResult.dimensionsMatch ? '(match)' : '(do not match)'}
							</div>
							<div>
								<strong>Pixel diff:</strong> {renderCompareResult.visibleDifferentPixels} visible pixels (
								{renderCompareResult.visibleDifferencePercent.toFixed(4)}%),{' '}
								{renderCompareResult.strictDifferentPixels} strict pixels, max channel delta{' '}
								{renderCompareResult.maxChannelDelta}
							</div>
						</div>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
							<div>
								<strong>Frontend</strong>
								<img alt="Frontend render" style={{ width: '100%', border: '1px solid #ddd' }} src={renderCompareResult.frontendDataUrl} />
							</div>
							<div>
								<strong>API</strong>
								<img alt="API render" style={{ width: '100%', border: '1px solid #ddd' }} src={renderCompareResult.apiDataUrl} />
							</div>
							<div>
								<strong>Diff</strong>
								<img alt="Render diff" style={{ width: '100%', border: '1px solid #ddd' }} src={renderCompareResult.diffDataUrl} />
							</div>
						</div>
					</div>
				)}
			</Modal>
		);
		return (
			<Content
				title={title}
				content={content}
				loading={loading}
				previewModal={
					<React.Fragment>
						{previewModal}
						{renderCompareModal}
					</React.Fragment>
				}
				className=""
			/>
		);
	}
}

export default ImageMapEditor;
