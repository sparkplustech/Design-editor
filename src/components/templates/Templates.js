import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Input, message } from 'antd';
import './TemplatesStyle.less';
import { authHeaders, fetchDesignerJson, getCanvasObjects, loadDesignerSession } from '../../utils/designerApi';

const Templates = ({ canvasRef, onPageSizeChange, onCanvasChange, mainLoader }) => {
	const [selectedTemplate, setSelectedTemplate] = useState(null);
	const [templatesData, setTemplatesData] = useState({
		a4PortraitTemplates: [],
		a4LandscapeTemplates: [],
	});
	const [loading, setLoading] = useState(true);
	const [userData, setUserData] = useState(null);
	const [query, setQuery] = useState('');

	useEffect(() => {
		let isMounted = true;

		const loadTemplates = async () => {
			try {
				const session = await loadDesignerSession();
				const data = await fetchDesignerJson('/templates/getAllCertificateTemplates', {
					headers: authHeaders(session.accessToken),
				});

				if (!isMounted) return;

				const templates = Array.isArray(data?.templates) ? data.templates : [];
				const portraitTemplates = templates.filter(template => template.pageSize === 'a4portrait');
				const landscapeTemplates = templates.filter(template => template.pageSize === 'a4landscape');

				setUserData(session);
				setTemplatesData({
					a4PortraitTemplates: portraitTemplates,
					a4LandscapeTemplates: landscapeTemplates,
				});
			} catch (error) {
				if (!isMounted) return;
				message.error('Unable to load certificate templates.');
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		loadTemplates();

		return () => {
			isMounted = false;
		};
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

	async function handleTemplateClick(tempdata) {
		if (!userData?.accessToken) {
			message.error('Designer session expired. Refresh and try again.');
			return;
		}

		mainLoader(true);

		try {
			const data = await fetchDesignerJson(`/templates/getCertificateTemplate/${tempdata?.id}`, {
				headers: authHeaders(userData.accessToken),
			});
			const objects = getCanvasObjects(data?.templateCode);
			const pageSize = tempdata?.pageSize;

			if (!pageSize) {
				throw new Error('Template page size is missing.');
			}

			onPageSizeChange(pageSize);
			canvasRef.handler.clear(true);

			setTimeout(() => {
				canvasRef.handler.importJSON(objects);
				onCanvasChange(true);
			}, 50);
		} catch (error) {
			message.error('Unable to load selected certificate template.');
		} finally {
			mainLoader(false);
		}
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
				placeholder="Search templates"
				value={query}
				onChange={event => setQuery(event.target.value)}
				style={{ marginBottom: 12 }}
			/>

			{!selectedTemplate && visibleLandscapeTemplates.length > 0 && (
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
							<Col key={item.id || imgIndex} span={12}>
								<button
									type="button"
									className="template-card certificate-img1"
									onClick={() => handleTemplateClick(item)}
									aria-label={`Load landscape template ${imgIndex + 1}`}
								>
									<img
										src={item.imageLink}
										className="template-img"
										loading="lazy"
										alt={`Template Landscape Image ${imgIndex + 1}`}
									/>
								</button>
							</Col>
						))}
					</Row>
				</div>
			)}

			{!selectedTemplate && visiblePortraitTemplates.length > 0 && (
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
							<Col key={item.id || imgIndex} span={12}>
								<button
									type="button"
									className="template-card certificate-img2"
									onClick={() => handleTemplateClick(item)}
									aria-label={`Load portrait template ${imgIndex + 1}`}
								>
									<img
										src={item.imageLink}
										className="template-img"
										loading="lazy"
										alt={`Template Portrait Image ${imgIndex + 1}`}
									/>
								</button>
							</Col>
						))}
					</Row>
				</div>
			)}

			{visiblePortraitTemplates.length === 0 && visibleLandscapeTemplates.length === 0 && (
				<Row className="template-row">
					<Col span={24}>
						<h3>{query ? 'No templates match your search.' : 'No templates available.'}</h3>
					</Col>
				</Row>
			)}

			{selectedTemplate && selectedTemplate.length > 0 && (
				<div className="template-design-all">
					<Row className="template-row">
						<Col span={8}>
							<button type="button" className="panel-link panel-link-left" onClick={handleBackClick}>
								All Templates
							</button>
						</Col>
						<Col span={16}>
							<h3>{selectedTemplate[0].pageSize === 'a4portrait' ? 'A4 Portrait' : 'A4 Landscape'}</h3>
						</Col>
					</Row>

					<Row>
						{selectedTemplate.map((item, imgIndex) => (
							<Col key={item.id || imgIndex} span={12}>
								<button
									type="button"
									onClick={() => handleTemplateClick(item)}
									aria-label={`Load ${item.pageSize === 'a4portrait' ? 'portrait' : 'landscape'} template ${
										imgIndex + 1
									}`}
									className={`template-card ${item.pageSize === 'a4portrait' ? 'certificate-img2' : 'certificate-img1'}`}
								>
									<img
										src={item.imageLink}
										className="template-img"
										loading="lazy"
										alt={`Template Image ${imgIndex + 1}`}
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

export default Templates;
