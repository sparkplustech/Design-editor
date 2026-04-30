import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { List, Button, Avatar } from 'antd';
import Icon from '../../../components/icon/Icon';

class StyleList extends Component {
	static propTypes = {
		styles: PropTypes.array,
		onEdit: PropTypes.func,
		onDelete: PropTypes.func,
	};

	render() {
		const { styles, onEdit, onDelete } = this.props;
		return (
			<List
				dataSource={styles}
				renderItem={(style, index) => {
					const actions = [
						<Button
							aria-label={`Edit style ${style.title}`}
							className="rde-action-btn"
							key="edit"
							shape="circle"
							title={`Edit style ${style.title}`}
							onClick={() => {
								onEdit(style, index);
							}}
						>
							<Icon name="edit" />
						</Button>,
						<Button
							aria-label={`Delete style ${style.title}`}
							className="rde-action-btn"
							key="delete"
							shape="circle"
							title={`Delete style ${style.title}`}
							onClick={() => {
								onDelete(index);
							}}
						>
							<Icon name="times" />
						</Button>,
					];
					const description = `fill: ${style.fill}, opacity: ${style.opacity}`;
					return (
						<List.Item actions={actions}>
							<List.Item.Meta
								avatar={<Avatar>{index}</Avatar>}
								title={style.title}
								description={description}
							/>
						</List.Item>
					);
				}}
			/>
		);
	}
}

export default StyleList;
