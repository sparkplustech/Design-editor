import React, { useState, useEffect } from 'react';
import { Row, Col, Spin } from 'antd';
import './TemplatesStyle.less';
import CONSTANTS from '../../../constant';

const Templates = ({ canvasRef, onPageSizeChange, onCanvasChange, mainLoader }) => {
	const [selectedTemplate, setSelectedTemplate] = useState(null);
	const [templatesData, setTemplatesData] = useState({
		a4PortraitTemplates: [],
		a4LandscapeTemplates: [],
	});
	const [loading, setLoading] = useState(true);
	const [userData, setUserData] = useState([])

	useEffect(() => {
		const queryParams = new URLSearchParams(window.location.search);
		const designCode = queryParams.get('designCode');	

		fetch(`${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getusertoken/${designCode}`, {
			headers: {},
		})
			.then(response => response.json())
			.then(data => {
				setUserData(data)

				fetch(`${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getAllCertificateTemplates`, {
					headers: {
						Authorization: `Bearer ${data.accessToken}`,
					},
				})
					.then(response => response.json())
					.then(data => {
						const portraitTemplates = data?.templates?.filter(template => template.pageSize === 'a4portrait') || [];
						const landscapeTemplates =
							data?.templates?.filter(template => template.pageSize === 'a4landscape') || [];
		
						setTemplatesData({
							...templatesData,
							a4PortraitTemplates: portraitTemplates,
							a4LandscapeTemplates: landscapeTemplates,
						});
		
						setLoading(false);
					})
					.catch(error => console.error('Error fetching templates:', error));
			})
			.catch(error => console.error('Error fetching usertoken:', error));

	}, []);

	const handleSeeAllClick = templateType => {
		if (templateType === 'a4LandscapeTemplates') {
			setSelectedTemplate(templatesData.a4LandscapeTemplates);
		} else if (templateType === 'a4PortraitTemplates') {
			setSelectedTemplate(templatesData.a4PortraitTemplates);
		}
	};

	const handleBackClick = () => {
		setSelectedTemplate(null);
	};

	function handleTemplateClick(tempdata) {
		mainLoader(true);
		fetch(`${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getCertificateTemplate/${tempdata?.id}`, {
			headers: {
				Authorization: `Bearer ${userData.accessToken}`,
			},
		})
			.then(response => response.json())
			.then(data => {
				
				try {
					const objects = data?.templateCode?.objects;
					const pageSize = tempdata?.pageSize;
					onPageSizeChange(pageSize);
					canvasRef.handler.clear();
					
						if(pageSize === 'a4landscape'){
							objects.unshift(CONSTANTS.JSON_CONSTANT.LANDSCAPE_CERTIFICATE);
						}else{
							objects.unshift(CONSTANTS.JSON_CONSTANT.PORTRAIT_CERTIFICATE);
						}

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
		return <Spin size="large" className="loader-class" />;
	}

	return (
		<div className="TemplatesSection">
			{!selectedTemplate && templatesData.a4LandscapeTemplates && (
				<div className="template-design">
					<Row className="template-row">
						<Col span={18}>
							<h3>A4 Landscape</h3>
						</Col>
						<Col span={6}>
							<span onClick={() => handleSeeAllClick('a4LandscapeTemplates')}>See All</span>
						</Col>
					</Row>

					<Row>
						{templatesData.a4LandscapeTemplates?.slice(0, 2).map((item, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<div className="certificate-img1">
									<img
										src={item.imageLink}
										onClick={() => handleTemplateClick(item)}
										className="template-img"
										alt={`Template Landscape Image ${imgIndex + 1}`}
									/>
								</div>
							</Col>
						))}
					</Row>
				</div>
			)}

			{!selectedTemplate && templatesData.a4PortraitTemplates && (
				<div className="template-design">
					<Row className="template-row">
						<Col span={18}>
							<h3>A4 Portrait</h3>
						</Col>
						<Col span={6}>
							<span onClick={() => handleSeeAllClick('a4PortraitTemplates')}>See All</span>
						</Col>
					</Row>

					<Row>
						{templatesData.a4PortraitTemplates?.slice(0, 2).map((item, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<div className="certificate-img2">
									<img
										src={item.imageLink}
										onClick={() => handleTemplateClick(item)}
										className="template-img"
										alt={`Template Portrait Image ${imgIndex + 1}`}
									/>
								</div>
							</Col>
						))}
					</Row>
				</div>
			)}

			{selectedTemplate && (
				<div className="template-design-all">
					<Row className="template-row">
						<Col span={8}>
							<span onClick={handleBackClick}>All Templates</span>
						</Col>
						<Col span={16}>
							<h3>{selectedTemplate[0].pageSize === 'a4portrait' ? 'A4 Portrait' : 'A4 Landscape'}</h3>
						</Col>
					</Row>

					<Row>
						{selectedTemplate.map((item, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<div
									className={item.pageSize === 'a4portrait' ? 'certificate-img2' : 'certificate-img1'}
								>
									<img
										src={item.imageLink}
										onClick={() => handleTemplateClick(item)}
										className="template-img"
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

export default Templates;
