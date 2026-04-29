import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Input, message } from 'antd';
import './DesignStyle.less';
import CONSTANTS from '../../../constant';

const Design = ({ canvasRef, onPageSizeChange, onCanvasChange, mainLoader }) => {
	const [selectedTemplate, setSelectedTemplate] = useState(null);
	const [templatesData, setTemplatesData] = useState({
		a4PortraitTemplates: [],
		a4LandscapeTemplates: [],
	});
	const [loading, setLoading] = useState(true);
	const [designCode, setDesignCode] = useState("");
	const [userData, setUserData] = useState([]);
	const [query, setQuery] = useState('');

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
				fetch(`${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getallusercertificateTemplates`, {
					headers: {
						Authorization: `Bearer ${data.accessToken}`,
					},
				})
					.then(response => response.json())
					.then(data => {
						const portraitTemplates = data?.certificates?.filter(template => template.pageSize === 'a4portrait') || [];
						const landscapeTemplates =
							data?.certificates?.filter(template => template.pageSize === 'a4landscape') || [];
		
						setTemplatesData({
							a4PortraitTemplates: portraitTemplates,
							a4LandscapeTemplates: landscapeTemplates,
						});
		
						setLoading(false);
					})
					.catch(() => {
						message.error('Unable to load saved designs.');
						setLoading(false);
					});
			})
			.catch(() => {
				message.error('Unable to start designer session.');
				setLoading(false);
			});
	}, []);

	const handleSeeAllClick = templateType => {
		if (templateType === 'a4LandscapeTemplates') {
			setSelectedTemplate(visibleLandscapeTemplates);
		} else if (templateType === 'a4PortraitTemplates') {
			setSelectedTemplate(visiblePortraitTemplates);
		}
	};

	const handleBackClick = () => {
		setSelectedTemplate(null);
	};

	function handleTemplateClick(tempdata) {
		mainLoader(true);
		fetch(`${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getuserCertificateTemplate/${tempdata?.id}`, {
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
					canvasRef.handler.clear(true);
					
					if (objects && Array.isArray(objects)) {
						setTimeout(() => {
							canvasRef.handler.importJSON(objects);
							onCanvasChange(true);
						}, 50);
					} else {
						message.error('Saved design data is invalid.');
					}
				} catch (error) {
					message.error('Unable to load selected design.');
				}

				mainLoader(false);
			})
			.catch(() => {
				message.error('Unable to load selected design.');
				mainLoader(false);
			});
	}

	const filterTemplates = templates =>
		templates.filter(template => {
			const term = query.trim().toLowerCase();
			if (!term) return true;
			return `${template.name || ''} ${template.TemplateName || ''} ${template.pageSize || ''}`
				.toLowerCase()
				.includes(term);
		});

	const visibleLandscapeTemplates = filterTemplates(templatesData.a4LandscapeTemplates);
	const visiblePortraitTemplates = filterTemplates(templatesData.a4PortraitTemplates);

	if (loading) {
		return <Spin size="large" className="loader-class" />;
	}

	return (
		<div className="TemplatesSection">
			<Input.Search
				allowClear
				placeholder="Search designs"
				value={query}
				onChange={event => setQuery(event.target.value)}
				style={{ marginBottom: 12 }}
			/>

			{!selectedTemplate && visibleLandscapeTemplates && visibleLandscapeTemplates.length > 0 && (
				<div className="template-design">
					<Row className="template-row">
						<Col span={18}>
							<h3>A4 Landscape</h3>
						</Col>
						<Col span={6}>
							<button type="button" className="panel-link" onClick={() => handleSeeAllClick('a4LandscapeTemplates')}>
								See All
							</button>
						</Col>
					</Row>

					<Row>
						{visibleLandscapeTemplates.slice(0, 2).map((item, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<button
									type="button"
									className="template-card certificate-img1"
									onClick={() => handleTemplateClick(item)}
									aria-label={`Load landscape design ${imgIndex + 1}`}
								>
									<img
										src={item.imageLink}
										className="template-img"
										loading="lazy"
										alt={`Landscape design ${imgIndex + 1}`}
									/>
								</button>
							</Col>
						))}
					</Row>
				</div>
			)}

			{!selectedTemplate && visiblePortraitTemplates && visiblePortraitTemplates.length > 0 &&  (
				<div className="template-design">
					<Row className="template-row">
						<Col span={18}>
							<h3>A4 Portrait</h3>
						</Col>
						<Col span={6}>
							<button type="button" className="panel-link" onClick={() => handleSeeAllClick('a4PortraitTemplates')}>
								See All
							</button>
						</Col>
					</Row>

					<Row>
						{visiblePortraitTemplates.slice(0, 2).map((item, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<button
									type="button"
									className="template-card certificate-img2"
									onClick={() => handleTemplateClick(item)}
									aria-label={`Load portrait design ${imgIndex + 1}`}
								>
									<img
										src={item.imageLink}
										className="template-img"
										loading="lazy"
										alt={`Portrait design ${imgIndex + 1}`}
									/>
								</button>
							</Col>
						))}
					</Row>
				</div>
			)}

			{visiblePortraitTemplates.length === 0 && visibleLandscapeTemplates.length === 0 &&(
				<Row className="template-row">
				<Col span={24}>
					<h3>{query ? 'No designs match your search.' : 'No designs available.'}</h3>
				</Col>
			</Row>
			)}

			{selectedTemplate && (
				<div className="template-design-all">
					<Row className="template-row">
						<Col span={8}>
							<button type="button" className="panel-link panel-link-left" onClick={handleBackClick}>
								All Designs
							</button>
						</Col>
						<Col span={16}>
							<h3>{selectedTemplate[0].pageSize === 'a4portrait' ? 'A4 Portrait' : 'A4 Landscape'}</h3>
						</Col>
					</Row>

					<Row>
						{selectedTemplate.map((item, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<button
									type="button"
									onClick={() => handleTemplateClick(item)}
									aria-label={`Load ${item.pageSize === 'a4portrait' ? 'portrait' : 'landscape'} design ${imgIndex + 1}`}
									className={`template-card ${item.pageSize === 'a4portrait' ? 'certificate-img2' : 'certificate-img1'}`}
								>
									<img
										src={item.imageLink}
										className="template-img"
										loading="lazy"
										alt={`Design Image ${imgIndex + 1}`}
									/>
								</button>
							</Col>
						))}
					</Row>
				</div>
			)}
		</div>
	);
};

export default Design;
