import React, { useState, useEffect } from 'react';
import { Row, Col, Spin } from 'antd';
import './BadgeBackgroundStyle.less';

const BadgeBackground = ({ canvasRef }) => {
	const [templatesData, setTemplatesData] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(`${process.env.REACT_APP_API_BASE_URL}/templates/getAllBadgeTemplates`, {
			headers: {
				Authorization: `Bearer ${process.env.REACT_APP_API_TOKEN}`,
			},
		})
			.then(response => response.json())
			.then(data => {
				setTemplatesData(data);
				setLoading(false);
			})
			.catch(error => console.error('Error fetching templates:', error));
	}, []);

	function handleTemplateClick(objectsData) {
		try {
		  const objects = objectsData.objects;
	
		  canvasRef.handler.clear();
		  
		  if (objects && Array.isArray(objects)) {
			
			canvasRef.handler.importJSON(objects);
		  } else {
			console.error('Invalid objects data format:', objects);
		  }
		} catch (error) {
		  console.error('Error:', error);
		}
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
						{templatesData?.Badges?.map((item, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<div className="certificate-img1">
									<img
										src={item.imageLink}
										onClick={() => handleTemplateClick(item.templateCode)}
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
