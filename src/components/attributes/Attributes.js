import React, { Component } from 'react';
import { Row, Col, Divider, Empty, Input, message } from 'antd';
import PropTypes from 'prop-types';
import { v4 as uuid } from 'uuid';

const attributeGroups = [
	{
		title: 'Issuer',
		items: [
			{ label: 'Issuer Name', token: '[IssuerName]' },
			{ label: 'Issuer Logo', token: '[IssuerLogo]' },
			{ label: 'Issuer Website', token: '[IssuerWebsite]' },
		],
	},
	{
		title: 'Credential',
		items: [
			{ label: 'Credential ID', token: '[CredentialId]' },
			{ label: 'Credential Name', token: '[CredentialName]' },
			{ label: 'Issue Date', token: '[IssueDate]' },
			{ label: 'Expiry Date', token: '[ExpiryDate]' },
			{ label: 'Start Date', token: '[startDate]' },
			{ label: 'End Date', token: '[endDate]' },
			{ label: 'URL', token: '[Url]' },
			{ label: 'UUID', token: '[Uuid]' },
			{ label: 'Level', token: '[Level]' },
			{ label: 'QR Code', token: '[QRCode]' },
		],
	},
	{
		title: 'Recipient',
		items: [{ label: 'Recipient Name', token: '[RecipientName]' }],
	},
];

class Attributes extends Component {
	static propTypes = {
		canvasRef: PropTypes.any,
	};

	state = {
		query: '',
	};

	getItem(name) {
		if (name === '[IssuerLogo]') {
			return {
				type: 'image',
				option: {
					type: 'image',
					src: '../../../images/sample/issuerlogo.png',
					width: 200,
					height: 60,
					name: 'attribute',
				},
			};
		}

		if (name === '[QRCode]') {
			return {
				type: 'image',
				option: {
					type: 'image',
					src: '../../../images/sample/qr.svg',
					name: 'attribute-qr',
				},
			};
		}

		return {
			name: 'Text',
			description: '',
			type: 'textbox',
			editable: false,
			icon: {
				prefix: 'fas',
				name: 'font',
			},
			option: {
				type: 'textbox',
				text: name,
				width: 400,
				height: 30,
				fontSize: 20,
				name: 'attribute',
				textAlign: 'center',
			},
		};
	}

	getVisibleGroups = () => {
		const query = this.state.query.trim().toLowerCase();

		if (!query) {
			return attributeGroups;
		}

		return attributeGroups
			.map(group => ({
				...group,
				items: group.items.filter(
					item =>
						item.label.toLowerCase().includes(query) ||
						item.token.toLowerCase().includes(query) ||
						group.title.toLowerCase().includes(query),
				),
			}))
			.filter(group => group.items.length > 0);
	};

	handlers = {
		onAddItem: (item, centered) => {
			const { canvasRef } = this.props;
			if (canvasRef.handler.interactionMode === 'polygon') {
				message.info('Already drawing');
				return;
			}
			const id = uuid();
			const option = Object.assign({}, item.option, { id });
			if (item.option.superType === 'svg' && item.type === 'default') {
				this.handlers.onSVGModalVisible(item.option);
				return;
			}
			canvasRef.handler.add(option, centered);
		},
	};

	renderAttributeButton = item => (
		<button
			key={item.token}
			type="button"
			className="sub-attribute"
			draggable
			aria-label={`Add ${item.label} variable`}
			title={item.token}
			onClick={() => this.handlers.onAddItem(this.getItem(item.token), true)}
		>
			<span>{item.label}</span>
			<small>{item.token}</small>
		</button>
	);

	render() {
		const visibleGroups = this.getVisibleGroups();

		return (
			<Row className="panel-space">
				<Col>
					<Input.Search
						allowClear
						placeholder="Search variables"
						value={this.state.query}
						onChange={event => this.setState({ query: event.target.value })}
						style={{ marginBottom: 12 }}
					/>

					{visibleGroups.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No variables found" />}

					{visibleGroups.map((group, index) => (
						<div key={group.title}>
							{index > 0 && <Divider />}
							<h4 className="main-attribute">{group.title}</h4>
							<div className="attribute-list">{group.items.map(this.renderAttributeButton)}</div>
						</div>
					))}
				</Col>
			</Row>
		);
	}
}

export default Attributes;
