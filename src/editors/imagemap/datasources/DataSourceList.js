import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { List, Button, Avatar } from 'antd';

import Icon from '../../../components/icon/Icon';

class DataSourceList extends Component {
	static propTypes = {
		dataSources: PropTypes.array,
		onEdit: PropTypes.func,
		onDelete: PropTypes.func,
	};

	render() {
		const { dataSources, onEdit, onDelete } = this.props;
		return (
			<List
				dataSource={dataSources}
				renderItem={(dataSource, index) => {
					const actions = [
						<Button
							aria-label={`Edit data source ${dataSource.title}`}
							className="rde-action-btn"
							key="edit"
							shape="circle"
							title={`Edit data source ${dataSource.title}`}
							onClick={() => {
								onEdit(dataSource, index);
							}}
						>
							<Icon name="edit" />
						</Button>,
						<Button
							aria-label={`Delete data source ${dataSource.title}`}
							className="rde-action-btn"
							key="delete"
							shape="circle"
							title={`Delete data source ${dataSource.title}`}
							onClick={() => {
								onDelete(index);
							}}
						>
							<Icon name="times" />
						</Button>,
					];
					return (
						<List.Item actions={actions}>
							<List.Item.Meta
								avatar={<Avatar>{index}</Avatar>}
								title={dataSource.title}
								description={dataSource.type}
							/>
						</List.Item>
					);
				}}
			/>
		);
	}
}

export default DataSourceList;
