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

	validateFile = (file) => {
		const { accept, limit } = this.props;

		if (accept === 'image/*') {
			const isUnderLimit = file.size / 1024 / 1024 < limit;
			if (!isUnderLimit) {
				message.error(`File size exceeds limit of ${limit}MB.`);
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

		const isUnderLimit = file.size / 1024 / 1024 < limit;
		if (!isUnderLimit) {
			message.error(`File size exceeds limit of ${limit}MB.`);
			return false;
		}

		return true;
	};

	resizeImageToFitCanvas = (file, maxWidth, maxHeight) => {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const { width, height } = img;

				if (width <= maxWidth && height <= maxHeight) {
					file.uid = file.uid || `${Date.now()}-${Math.random()}`;
					resolve(file);
					return;
				}

				const ratio = Math.min(maxWidth / width, maxHeight / height);
				const newWidth = width * ratio;
				const newHeight = height * ratio;

				const canvas = document.createElement('canvas');
				canvas.width = newWidth;
				canvas.height = newHeight;
				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, newWidth, newHeight);

				canvas.toBlob((blob) => {
					const resizedFile = new File([blob], file.name, {
						type: file.type,
						lastModified: Date.now(),
					});
					resizedFile.uid = file.uid || `${Date.now()}-${Math.random()}`;
					resolve(resizedFile);
				}, file.type);
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
		const { width, height } = this.getCanvasSize();

		const props = {
			accept,
			name: 'file',
			multiple: false,
			beforeUpload: async (file) => {
				const isValid = this.validateFile(file);
				if (!isValid) return false;

				const resizedFile = await this.resizeImageToFitCanvas(file, width, height);

				this.setState({ fileList: [resizedFile] });
				if (onChange) onChange(resizedFile);

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
