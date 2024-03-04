import React, { useState, useEffect } from 'react';
import { Row, Col, Spin } from 'antd';
import '../badge-background/BadgeBackgroundStyle.less';
import CONSTANTS from '../../../constant';

const BadgeDesign = ({ canvasRef, mainLoader }) => {
	const [templatesData, setTemplatesData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [designCode, setDesignCode] = useState("");
	const [userData, setUserData] = useState("");

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

				fetch(`${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getalluserbadgeTemplates`, {
					headers: {
						Authorization: `Bearer ${data.accessToken}`,
					},
				})
					.then(response => response.json())
					.then(data => {
						setTemplatesData(data);
						setLoading(false);
					})
					.catch(error => console.error('Error fetching templates:', error));
			})
			.catch(error => console.error('Error fetching usertoken:', error));

	}, []);

	function handleTemplateClick(tempdata) {
		mainLoader(true);
		fetch(`${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getuserBadgeTemplate//${tempdata?.id}`, {
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
			{templatesData && templatesData.count  > 0 ? (
				<div  className="template-design">
					<Row className="template-row">
						<Col span={24}>
							<h3>Template Designs</h3>
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
										alt={`Template Badge Image ${imgIndex + 1}`}
									/>
								</div>
							</Col>
						))}
					</Row>
				</div>
			): (
				<Row className="template-row">
						<Col span={24}>
							<h3>No designs available.</h3>
						</Col>
					</Row>
			)}
		</div>
	);
};

export default BadgeDesign;
