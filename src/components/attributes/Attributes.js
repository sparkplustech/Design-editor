import React, { Component } from 'react';
import { Row, Col, Divider } from 'antd';
import PropTypes from 'prop-types';
import { uuid } from 'uuidv4';

class Attributes extends Component {
	item = '';
	static propTypes = {
		canvasRef: PropTypes.any,
	};

	getItem(name) {
		const currentPath = window.location.pathname;
		const isAdminBadgePath = currentPath.includes('admin-badge-designer');
	
		let item={}
		if(name=="[IssuerLogo]")
			{
				item = {	
					type: 'image',
					option: {
					type: 'image',
					src: "../../../images/sample/issuerlogo.png",
					width:200,
					height:60,
					name:'attribute'
				}
			}
			}

			else
			{
		item = {
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
		return item;
	}
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

	render() {
		return (
			<Row className="panel-space">
				<Col>
					<h4 className="main-attribute">Issuer</h4>
					<p
						className="sub-attribute"
						draggable
						onClick={e => this.handlers.onAddItem(this.getItem('[IssuerName]'), true)}
					>
						Issuer Name
					</p>
					<p
						className="sub-attribute"
						draggable
						onClick={e => this.handlers.onAddItem(this.getItem('[IssuerLogo]'), true)}
					>
						Issuer Logo
					</p>
					<Divider />
					{/* <h4 className="main-attribute">Group</h4>

					<p
						className="sub-attribute"
						draggable
						onClick={e => this.handlers.onAddItem(this.getItem('[CourseName]'), true)}
					>
						Course Name
					</p>
					<p
						className="sub-attribute"
						draggable
						onClick={e => this.handlers.onAddItem(this.getItem('[CourseDescription]'), true)}
					>
						Course Description
					</p>
					<Divider /> */}
					<h4 className="main-attribute"> Credential</h4>
					<p
						className="sub-attribute"
						onClick={e => this.handlers.onAddItem(this.getItem('[CredentialId]'), true)}
					>
						Credential ID
					</p>
					<p
						className="sub-attribute"
						onClick={e => this.handlers.onAddItem(this.getItem('[CredentialName]'), true)}
					>
						Credential Name
					</p>
					{/* <p
						className="sub-attribute"
						onClick={e => this.handlers.onAddItem(this.getItem('[CredentialILicenseId]'), true)}
					>
						Credential License ID
					</p> */}
					<p
						className="sub-attribute"
						onClick={e => this.handlers.onAddItem(this.getItem('[IssueDate]'), true)}
					>
						Issue Date
					</p>
					<p
						className="sub-attribute"
						onClick={e => this.handlers.onAddItem(this.getItem('[ExpiryDate]'), true)}
					>
						Expiry Date
					</p>
					<p
						className="sub-attribute"
						onClick={e => this.handlers.onAddItem(this.getItem('[startDate]'), true)}
					>
						Start Date
					</p>
					<p
						className="sub-attribute"
						onClick={e => this.handlers.onAddItem(this.getItem('[endDate]'), true)}
					>
						End Date
					</p>
					{/* <p className="sub-attribute" onClick={e => this.handlers.onAddItem(this.getItem('[Grade]'), true)}>
						Grade
					</p> */}
					<p className="sub-attribute" onClick={e => this.handlers.onAddItem(this.getItem('[Url]'), true)}>
						URL
					</p>
					<p className="sub-attribute" onClick={e => this.handlers.onAddItem(this.getItem('[Uuid]'), true)}>
						UUID
					</p>
					<Divider />
					<h4
						className="main-attribute"
						onClick={e => this.handlers.onAddItem(this.getItem('[Recipient]'), true)}
					>
						Recipient
					</h4>
					{/* <p
						className="sub-attribute"
						onClick={e => this.handlers.onAddItem(this.getItem('[RecipientId]'), true)}
					>
						Recipient ID
					</p> */}
					<p
						className="sub-attribute"
						onClick={e => this.handlers.onAddItem(this.getItem('[RecipientName]'), true)}
					>
						Recipient Name
					</p>
					{/* <p
						className="sub-attribute"
						onClick={e => this.handlers.onAddItem(this.getItem('[RecipientEmail]'), true)}
					>
						Recipient Email
					</p> */}
				</Col>
			</Row>
		);
	}
}

export default Attributes;
