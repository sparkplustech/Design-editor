import { Icon, Upload, message } from 'antd';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

const { Dragger } = Upload;

class FileUpload extends Component {
	static propTypes = {
		onChange: PropTypes.func,
		limit: PropTypes.number,
		accept: PropTypes.string,
	};

	static defaultProps = {
		limit: 5,
		accept: 'image/*',
	};

	state = {
		fileList: this.props.value ? [this.props.value] : [],
	};

	UNSAFE_componentWillReceiveProps(nextProps) {
		this.setState({
			fileList: nextProps.value ? [nextProps.value] : [],
		});
	}

	normalizeMimeType = (type) => {
		if (type === 'image/svg') {
			return 'image/svg+xml';
		}
		return type;
	};

	getReadableFileTypes = () => {
		const { accept } = this.props;

		if (accept === 'image/*') {
			return null;
		}

		const extensions = accept
			.split(',')
			.map((type) => type.replace('.', '').toUpperCase()); // Removing dot and converting to uppercase

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
			message.error(
				`Invalid file type. Only ${readableTypes} are allowed.`,
			);
			return false;
		}

		const isUnderLimit = file.size / 1024 / 1024 < limit;
		if (!isUnderLimit) {
			message.error(`File size exceeds limit of ${limit}MB.`);
			return false;
		}

		return true;
	};

	render() {
		const { accept, limit, onChange } = this.props;
		const { fileList } = this.state;

		const readableTypes = this.getReadableFileTypes();

		const props = {
			accept,
			name: 'file',
			multiple: false,
			beforeUpload: (file) => {
				const isValid = this.validateFile(file);

				if (!isValid) {
					return false;
				}

				this.setState({
					fileList: [file],
				});
				if (onChange) {
					onChange(file);
				}

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
