import React, { useState, useEffect } from 'react';
import { Row, Col, Spin } from 'antd';
import './BadgeBackgroundStyle.less';
import CONSTANTS from '../../../constant';

const BadgeBackground = ({ canvasRef, mainLoader, onCanvasChange, badgeType }) => {
	const [templatesData, setTemplatesData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [userData, setUserData] = useState([]);
	const [designCode, setDesignCode] = useState("");

	useEffect(() => {

		const queryParams = new URLSearchParams(window.location.search);
        const designCode = queryParams.get('designCode');
		setDesignCode(designCode);

		fetch(`${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getusertoken/${designCode}`, {
			headers: {},
		})
			.then(response => response.json())
			.then(data => {
				setUserData(data);

				fetch(`${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getAllBadgeTemplates`, {
					headers: {
						Authorization: `Bearer ${data.accessToken}`,
					},
				})
					.then(response => response.json())
					.then(data => {
						const background = data?.badges?.filter(template => template.type !== 'template') || [];
						const templates = data?.badges?.filter(template => template.type === 'template') || [];
						setTemplatesData(badgeType === "template"? templates : background );
						setLoading(false);
					})
					.catch(error => console.error('Error fetching templates:', error));

			})
			.catch(error => console.error('Error fetching usertoken:', error));
	}, []);

	function handleTemplateClick(tempdata) {
		mainLoader(true);
		fetch(`${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getBadgeTemplate/${tempdata?.id}`, {
			headers: {
				Authorization: `Bearer ${userData.accessToken}`,
			},
		})
			.then(response => response.json())
			.then(data => {
				try {
					const objects = data?.templateCode?.objects;
					canvasRef.handler.clear();
					objects.unshift(CONSTANTS.JSON_CONSTANT.BADGE);
					if (objects && Array.isArray(objects)) {
						canvasRef.handler.importJSON(objects);
						onCanvasChange(true);
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

	console.log("badge list", templatesData);

	return (
		<div className="BadgeSection">
			{templatesData && (
				<div  className="template-design">
					<Row className="template-row">
						<Col span={24}>
							<h3>{badgeType === "template"? "Template": "Background"} Shapes</h3>
						</Col>
					</Row>

					<Row>
						{templatesData?.map((item, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<div className="certificate-img1">
									<img
										src={item.imageLink}
										onClick={() => handleTemplateClick(item)}
										className="template-img"
										alt={`Template Badge Image ${imgIndex + 1}`}
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
