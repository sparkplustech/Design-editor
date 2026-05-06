import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'antd';

import PropertyDefinition from './PropertyDefinition';
import { Flex } from '../../../components/flex';
import Icon from '../../../components/icon/Icon';


class NodeProperties extends Component {
	static propTypes = {
		canvasRef: PropTypes.any,
		selectedItem: PropTypes.object,
	};

	componentDidUpdate(prevProps) {
		const { selectedItem, form } = this.props;
		if (prevProps.selectedItem !== selectedItem) {
			form.resetFields();
		}
	}

	render() {
		const { canvasRef, selectedItem, form } = this.props;
		const hasEditableControls = selectedItem && PropertyDefinition[selectedItem.type];
		return (
			<Form className="premium-inspector-form">
				{hasEditableControls ? (
					<React.Fragment>
						<div className="premium-inspector-header">
							<div>
								<div className="premium-inspector-eyebrow">Layer</div>
								<div className="premium-inspector-heading">{selectedItem.name || selectedItem.type}</div>
							</div>
							<span>{selectedItem.type}</span>
						</div>
						{Object.keys(PropertyDefinition[selectedItem.type]).map(key => {
							const definition = PropertyDefinition[selectedItem.type][key];
							return (
								<div className="premium-inspector-section" key={key}>
									<div className="premium-inspector-section-title">{definition.title}</div>
									{definition.component.render(canvasRef, form, selectedItem)}
								</div>
							);
						})}
					</React.Fragment>
				) : (
					<Flex justifyContent="center" alignItems="center" className="premium-inspector-empty">
						<div>
							<div className="premium-inspector-empty-icon">
								<Icon name="mouse-pointer" />
							</div>
							<div className="premium-inspector-empty-title">
								{selectedItem ? 'No editable controls' : 'Select an object'}
							</div>
							<div className="premium-inspector-empty-copy">
								{selectedItem ? 'This layer can still be moved, duplicated, or deleted.' : 'No layer is selected.'}
							</div>
						</div>
					</Flex>
				)}
			</Form>
		);
	}
}

export default Form.create({
	onValuesChange: (props, changedValues, allValues) => {
		const { onChange, selectedItem } = props;
		onChange(selectedItem, changedValues, allValues);
	},
})(NodeProperties);
