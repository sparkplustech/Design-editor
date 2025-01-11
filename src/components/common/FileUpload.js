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
		accept: 'image/*', // Default to accepting all image types
	};

	state = {
		fileList: this.props.value ? [this.props.value] : [],
	};

	UNSAFE_componentWillReceiveProps(nextProps) {
		this.setState({
			fileList: nextProps.value ? [nextProps.value] : [],
		});
	}

	// Normalize MIME types for comparison
	normalizeMimeType = (type) => {
		if (type === 'image/svg') {
			return 'image/svg+xml'; // Normalize shorthand for SVG
		}
		return type;
	};

	// Helper function to extract readable file types
	getReadableFileTypes = () => {
		const { accept } = this.props;

		// If accept is 'image/*', return null (no need to show specific file types)
		if (accept === 'image/*') {
			return null;
		}

		// Otherwise, create a list of readable file types from the accept string
		const extensions = accept
			.split(',')
			.map((type) => type.replace('.', '').toUpperCase()); // Removing dot and converting to uppercase

		return extensions.join(', ');
	};

	// Modified validateFile function to handle MIME types and extensions
	validateFile = (file) => {
		const { accept, limit } = this.props;

		// Check if 'accept' is 'image/*', which means accept all image types
		if (accept === 'image/*') {
			// If it's 'image/*', we can skip file type validation for images
			const isUnderLimit = file.size / 1024 / 1024 < limit;
			if (!isUnderLimit) {
				message.error(`File size exceeds limit of ${limit}MB.`);
				return false;
			}
			return true;
		}

		// Normalize allowed types
		const allowedTypes = accept.split(',').map(this.normalizeMimeType);

		// Check MIME type and file extension
		const isValidType = allowedTypes.some((type) => {
			if (type.startsWith('image/')) {
				return file.type === this.normalizeMimeType(type);
			} else {
				// For file extensions (e.g., .png, .svg), check the file's extension
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

		// File size validation
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
