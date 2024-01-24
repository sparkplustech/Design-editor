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
			icon: {
				prefix: "fas",
				name: "font"
			},
			option: {
				type: "textbox",
				text: name,
				width: 100,
				height: 30,
				fontSize: 32,
				name: "New text",
				editable: false,
				selectable: false


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
		onAddSVG: (option, centered) => {
			const { canvasRef } = this.props;
			canvasRef.handler.add({ ...option, type: 'svg', superType: 'svg', id: uuid(), name: 'New SVG' }, centered);
			this.handlers.onSVGModalVisible();
		},
		onDrawingItem: item => {
			const { canvasRef } = this.props;
			if (canvasRef.handler.interactionMode === 'polygon') {
				message.info('Already drawing');
				return;
			}
			if (item.option.type === 'line') {
				canvasRef.handler.drawingHandler.line.init();
			} else if (item.option.type === 'arrow') {
				canvasRef.handler.drawingHandler.arrow.init();
			} else {
				canvasRef.handler.drawingHandler.polygon.init();
			}
		},
		onChangeActiveKey: activeKey => {
			this.setState({
				activeKey,
			});
		},
		onCollapse: () => {
			this.setState({
				collapse: !this.state.collapse,
			});
		},
		onSearchNode: e => {
			const filteredDescriptors = this.handlers
				.transformList()
				.filter(descriptor => descriptor.name.toLowerCase().includes(e.target.value.toLowerCase()));
			this.setState({
				textSearch: e.target.value,
				filteredDescriptors,
			});
		},
		transformList: () => {
			return Object.values(this.props.descriptors).reduce((prev, curr) => prev.concat(curr), []);
		},
		onSVGModalVisible: () => {
			this.setState(prevState => {
				return {
					svgModalVisible: !prevState.svgModalVisible,
				};
			});
		},
		onDesignClick: () => {
			this.setState({ activeSection: 'design' });
			this.setState({ collapse: false });
		},
		onTemplateClick: () => {
			this.setState({ activeSection: 'template' });
			this.setState({ collapse: false });
		},
		onComponentsClick: () => {
			this.setState({ activeSection: 'components' });
			this.setState({ collapse: false });
		},
		onAttributeClick: () => {
			this.setState({ activeSection: 'attribute' });
			this.setState({ collapse: false });
		},
	};

	events = {
		onDragStart: (e, item) => {
			this.item = item;
			const { target } = e;
			target.classList.add('dragging');
		},
		onDragOver: e => {
			if (e.preventDefault) {
				e.preventDefault();
			}
			e.dataTransfer.dropEffect = 'copy';
			return false;
		},
		onDragEnter: e => {
			const { target } = e;
			target.classList.add('over');
		},
		onDragLeave: e => {
			const { target } = e;
			target.classList.remove('over');
		},
		onDrop: e => {
			e = e || window.event;
			if (e.preventDefault) {
				e.preventDefault();
			}
			if (e.stopPropagation) {
				e.stopPropagation();
			}
			const { layerX, layerY } = e;
			const dt = e.dataTransfer;
			if (dt.types.length && dt.types[0] === 'Files') {
				const { files } = dt;
				Array.from(files).forEach(file => {
					file.uid = uuid();
					const { type } = file;
					if (type === 'image/png' || type === 'image/jpeg' || type === 'image/jpg') {
						const item = {
							option: {
								type: 'image',
								file,
								left: layerX,
								top: layerY,
							},
						};
						this.handlers.onAddItem(item, false);
					} else {
						notification.warn({
							message: 'Not supported file type',
						});
					}
				});
				return false;
			}
			console.log(this.item)

			const option = Object.assign({}, this.item.option, { left: layerX, top: layerY });
			const newItem = Object.assign({}, this.item, { option });
			this.handlers.onAddItem(newItem, false);
			return false;
		},
		onDragEnd: e => {
			this.item = null;
			e.target.classList.remove('dragging');
		},
	};


	render(){

	
		return (
		<Row className="panel-space">
			<Col>
				<h4 className="main-attribute">Issuer</h4>
				<p className="sub-attribute" draggable
				onClick={e => this.handlers.onAddItem(this.getItem("[IssuerName]"), true)}
				onDragStart={e => this.events.onDragStart(e, this.getItem("[IssuerName]"))}
				onDragEnd={e => this.events.onDragEnd(e, this.getItem("[IssuerName]"))}
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
