import React, { Component } from 'react';
import { Row, Col, Divider } from 'antd';
import PropTypes from 'prop-types';
import { uuid } from 'uuidv4';


class Attributes extends Component {
item=""
	static propTypes = {
		canvasRef: PropTypes.any	};
	
	getItem(name) {
		let item={
			name: "Text",
			description: "",
			type: "text",
			editable: false,
			icon: {
				prefix: "fas",
				name: "font"
			},
			option: {
				type: "textbox",
				text: name,
				width: 400,
				height: 30,
				fontSize: 32,
				name: "attribute",
				textAlign: 'center',
			

			}}
		return item
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

	

	render(){

	
		return (
		<Row className="panel-space">
			<Col>
				<h4 className="main-attribute">Issuer</h4>
				<p className="sub-attribute" draggable
				onClick={e => this.handlers.onAddItem(this.getItem("[IssuerName]"), true)}
						>Issuer Name</p>
				<Divider />
				<h4 className='main-attribute'>Group</h4>

				<p className="sub-attribute" draggable
				
				>Course Name</p>
				<p className="sub-attribute">Course Description</p>
				<Divider />
				<h4 className="main-attribute"> Credential</h4>
				<p className="sub-attribute">Credential ID </p>
				<p className="sub-attribute">Credential License ID </p>
				<p className="sub-attribute">Issue Date </p>
				<p className="sub-attribute"> Expiry Date </p>
				<p className="sub-attribute">Grade </p>
				<p className="sub-attribute"> URL</p>
				<p className="sub-attribute"> UUID</p>
				<Divider />
				<h4 className="main-attribute">Recipient</h4>
				<p className="sub-attribute">Recipient ID </p>
				<p className="sub-attribute"> Recipient Name </p>
				<p className="sub-attribute"> Recipient Email</p>
			</Col>
		</Row>)
	}
};

export default Attributes;
