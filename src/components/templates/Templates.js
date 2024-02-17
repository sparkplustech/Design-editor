import React, { useState, useEffect } from 'react';
import { Row, Col, Spin } from 'antd';
import './TemplatesStyle.less';

const Templates = ({ canvasRef }) => {
	const [selectedTemplate, setSelectedTemplate] = useState(null);
	const [templatesData, setTemplatesData] = useState({
		a4PortraitTemplates: [],
		a4LandscapeTemplates: [],
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(`${process.env.REACT_APP_API_BASE_URL}/templates/getAllCertificateTemplates`, {
			headers: {
				Authorization: `Bearer ${process.env.REACT_APP_API_TOKEN}`,
			},
		})
			.then(response => response.json())
			.then(data => {
				const portraitTemplates = data?.templates?.filter(template => template.pageSize === 'a4portait') || [];
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

	function handleTemplateClick(objectsData) {
    try {
      const objects = objectsData?.templateCode?.objects;
      const pageSize = objectsData?.pageSize;
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
										alt={`Template Landscape} Image ${imgIndex + 1}`}
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
										alt={`Template Portrait} Image ${imgIndex + 1}`}
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
							<h3>{selectedTemplate[0].pageSize === 'a4portait' ? 'A4 Portrait' : 'A4 Landscape'}</h3>
						</Col>
					</Row>

					<Row>
						{selectedTemplate.map((item, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<div
									className={
										item.pageSize === 'a4portait'
											? 'certificate-img2'
											: 'certificate-img1'
									}
								>
									<img src={item.imageLink}  onClick={() => handleTemplateClick(item)} className="template-img" />
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
