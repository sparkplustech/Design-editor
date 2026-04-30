import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form, Modal, Button, Input, message } from 'antd';
import i18n from 'i18next';

import Icon from '../icon/Icon';

class UrlModal extends Component {
	handlers = {
		onOk: () => {
			const { onChange } = this.props;
			const { tempUrl, url } = this.state;
			const nextUrl = (tempUrl || url || '').trim();

			if (!this.isSafeUrl(nextUrl)) {
				message.error('Enter a valid http, https, data, or blob URL.');
				return;
			}

			onChange(nextUrl);
			this.setState({
				visible: false,
				url: nextUrl,
				tempUrl: '',
			});
		},
		onCancel: () => {
			this.modalHandlers.onHide();
		},
		onClick: () => {
			this.modalHandlers.onShow();
		},
	};

	modalHandlers = {
		onShow: () => {
			this.setState({
				visible: true,
			});
		},
		onHide: () => {
			this.setState({
				visible: false,
			});
		},
	};

	static propTypes = {
		value: PropTypes.any,
		onChange: PropTypes.func,
		form: PropTypes.any,
	};

	state = {
		url: this.props.value || '',
		tempUrl: '',
		visible: false,
	};

	isSafeUrl = value => {
		if (!value) {
			return false;
		}

		if (/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/i.test(value) || value.startsWith('blob:')) {
			return true;
		}

		try {
			const parsedUrl = new URL(value);
			const isLocalHttp =
				parsedUrl.protocol === 'http:' &&
				['localhost', '127.0.0.1', '[::1]'].includes(parsedUrl.hostname);
			return parsedUrl.protocol === 'https:' || isLocalHttp;
		} catch (error) {
			return false;
		}
	};

	componentDidUpdate(prevProps) {
		if (prevProps.value !== this.props.value) {
			this.setState({
				url: this.props.value || '',
			});
		}
	}

	render() {
		const { onOk, onCancel, onClick } = this.handlers;
		const { form } = this.props;
		const { getFieldDecorator } = form;
		const { url, visible } = this.state;
		const label = (
			<React.Fragment>
				<span style={{ marginRight: 8 }}>{i18n.t('common.url')}</span>
				<Button onClick={onClick} shape="circle" className="rde-action-btn">
					<Icon name="edit" />
				</Button>
			</React.Fragment>
		);
		return (
			<React.Fragment>
				<Form.Item label={label} colon={false}>
					{getFieldDecorator('url', {
						rules: [
							{
								required: true,
								message: i18n.t('validation.enter-property', { arg: i18n.t('common.url') }),
							},
						],
						initialValue: url || '',
					})(<span style={{ wordBreak: 'break-all' }}>{url}</span>)}
				</Form.Item>
				<Modal onCancel={onCancel} onOk={onOk} visible={visible}>
					<Form.Item label={i18n.t('common.url')} colon={false}>
						<Input
							defaultValue={url}
							onChange={e => {
								this.setState({ tempUrl: e.target.value });
							}}
						/>
					</Form.Item>
				</Modal>
			</React.Fragment>
		);
	}
}

export default UrlModal;
