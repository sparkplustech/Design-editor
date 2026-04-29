import { Icon, Upload, message } from 'antd';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

const { Dragger } = Upload;

class FileUpload extends Component {
	static propTypes = {
		onChange: PropTypes.func,
		limit: PropTypes.number,
		accept: PropTypes.string,
		type: PropTypes.oneOf(['badge', 'certificate']),
		orientation: PropTypes.oneOf(['portrait', 'landscape']),
		value: PropTypes.any,
	};

	static defaultProps = {
		limit: 5,
		accept: 'image/*',
		type: 'badge',
		orientation: 'landscape',
	};

	state = {
		fileList: this.props.value ? [this.props.value] : [],
	};

	UNSAFE_componentWillReceiveProps(nextProps) {
		this.setState({
			fileList: nextProps.value ? [nextProps.value] : [],
		});
	}

	getCanvasSize = () => {
		const { type, orientation } = this.props;

		if (type === 'badge') {
			return { width: 490, height: 490 };
		}
		if (type === 'certificate') {
			if (orientation === 'portrait') {
				return { width: 608, height: 790 };
			}
			return { width: 790, height: 608 };
		}
		return { width: 500, height: 500 };
	};

	normalizeMimeType = (type) => {
		if (type === 'image/svg') return 'image/svg+xml';
		return type;
	};

	getReadableFileTypes = () => {
		const { accept } = this.props;
		if (accept === 'image/*') return null;

		const extensions = accept
			.split(',')
			.map((type) => type.replace('.', '').toUpperCase());

		return extensions.join(', ');
	};

	validateFileType = (file) => {
		const { accept } = this.props;

		if (accept === 'image/*') {
			if (!file.type.startsWith('image/')) {
				message.error('Invalid file type. Only images are allowed.');
				return false;
			}
			return true;
		}

		const allowedTypes = accept.split(',').map(this.normalizeMimeType);

		const isValidType = allowedTypes.some((type) => {
			if (type.startsWith('image/')) {
				return file.type === this.normalizeMimeType(type);
			} else {
				return file.name.toLowerCase().endsWith(type.toLowerCase());
			}
		});

		if (!isValidType) {
			const readableTypes = this.getReadableFileTypes();
			message.error(`Invalid file type. Only ${readableTypes} are allowed.`);
			return false;
		}

		return true;
	};

	validateFileSize = (file) => {
		const { limit } = this.props;
		const isUnderLimit = file.size / 1024 / 1024 < limit;
		if (!isUnderLimit) {
			message.error(`File size exceeds limit of ${limit}MB.`);
			return false;
		}

		return true;
	};

	optimizeImageForDesigner = (file) => {
		const maxDimension = 2400;
		const supportedRasterTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

		if (!supportedRasterTypes.includes(file.type)) {
			return Promise.resolve(file);
		}

		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onerror = () => resolve(file);
			reader.onload = (e) => {
				const img = new Image();
				img.onerror = () => resolve(file);
				img.onload = () => {
					const largestSide = Math.max(img.width, img.height);

					if (largestSide <= maxDimension) {
						resolve(file);
						return;
					}

					const scale = maxDimension / largestSide;
					const width = Math.round(img.width * scale);
					const height = Math.round(img.height * scale);
					const canvas = document.createElement('canvas');
					canvas.width = width;
					canvas.height = height;

					const ctx = canvas.getContext('2d');
					ctx.imageSmoothingEnabled = true;
					ctx.imageSmoothingQuality = 'high';
					ctx.drawImage(img, 0, 0, width, height);

					const outputType = file.type === 'image/png' ? 'image/png' : file.type;
					const outputQuality = outputType === 'image/png' ? undefined : 0.92;

					canvas.toBlob((blob) => {
						if (!blob) {
							resolve(file);
							return;
						}

						const optimizedFile = new File([blob], file.name, {
							type: outputType,
							lastModified: file.lastModified || Date.now(),
						});
						resolve(optimizedFile.size < file.size ? optimizedFile : file);
					}, outputType, outputQuality);
				};
				img.src = e.target.result;
			};
			reader.readAsDataURL(file);
		});
	};

	render() {
		const { accept, limit, onChange } = this.props;
		const { fileList } = this.state;
		const readableTypes = this.getReadableFileTypes();

		const props = {
			accept,
			name: 'file',
			multiple: false,
			beforeUpload: async (file) => {
				if (!this.validateFileType(file)) return false;
				if (!this.validateFileSize(file)) return false;

				const optimizedFile = await this.optimizeImageForDesigner(file);

				optimizedFile.uid = file.uid || `${Date.now()}-${Math.random()}`;

				this.setState({ fileList: [optimizedFile] });
				if (onChange) onChange(optimizedFile);

				return false;
			},
			onRemove: (file) => {
				this.setState(
					({ fileList }) => {
						const index = fileList.indexOf(file);
						const newFileList = fileList.slice();
						newFileList.splice(index, 1);
						return {
							fileList: newFileList,
						};
					},
					() => {
						if (onChange) {
							onChange(null);
						}
					},
				);
			},
			fileList,
		};

		return (
			<Dragger {...props}>
				<p className="ant-upload-drag-icon">
					<Icon type="file-add" />
				</p>
				<p className="ant-upload-text">Click or drag file to this area to upload</p>
				{readableTypes && (
					<p className="ant-upload-hint">{`Support for a single upload. Limited to ${limit}MB or less. Allowed types: ${readableTypes}`}</p>
				)}
				{!readableTypes && (
					<p className="ant-upload-hint">{`Support for a single upload. Limited to ${limit}MB or less.`}</p>
				)}
			</Dragger>
		);
	}
}

export default FileUpload;
