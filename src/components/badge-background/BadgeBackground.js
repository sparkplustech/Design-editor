import React, { useState, useEffect } from 'react';
import { Row, Col, Spin } from 'antd';
import './BadgeBackgroundStyle.less';
import API_CONSTANT from '../../../constant';

const BadgeBackground = ({ canvasRef, mainLoader }) => {
	const [templatesData, setTemplatesData] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(`${API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getAllBadgeTemplates`, {
			headers: {
				Authorization: `Bearer ${API_CONSTANT.REACT_APP_API_TOKEN}`,
			},
		})
			.then(response => response.json())
			.then(data => {
				setTemplatesData(data);
				setLoading(false);
			})
			.catch(error => console.error('Error fetching templates:', error));
	}, []);

	function handleTemplateClick(tempdata) {
		mainLoader(true);
		fetch(`${API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getBadgeTemplate/${tempdata?.id}`, {
			headers: {
				Authorization: `Bearer ${API_CONSTANT.REACT_APP_API_TOKEN}`,
			},
		})
			.then(response => response.json())
			.then(data => {
				try {
					const objects = data?.templateCode?.objects;
					canvasRef.handler.clear();

					if (objects && Array.isArray(objects)) {
						canvasRef.handler.importJSON(objects);
					} else {
						console.error('Invalid objects data format:', objects);
					}
				} catch (error) {
					console.error('Error:', error);
				}

				mainLoader(false);
			})
			.catch(error => console.error('Error fetching templates:', error));
	}
	  
	  if (loading) {
		return <Spin size="large" className='loader-class'/>;
	}

	return (
		<div className="BadgeSection">
			{templatesData && (
				<div  className="template-design">
					<Row className="template-row">
						<Col span={24}>
							<h3>Background Shapes</h3>
						</Col>
					</Row>

					<Row>
						{templatesData?.badges?.map((item, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<div className="certificate-img1">
									<img
										src={item.imageLink}
										onClick={() => handleTemplateClick(item)}
										className="template-img"
										alt={`Template Badge} Image ${imgIndex + 1}`}
									/>
								</div>
							</Col>
						))}
					</Row>
				</div>
			)}
		</div>
	);
};

export default BadgeBackground;
