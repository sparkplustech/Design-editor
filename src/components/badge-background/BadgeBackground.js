import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Input, message } from 'antd';
import './BadgeBackgroundStyle.less';
import CONSTANTS from '../../../constant';

const BadgeBackground = ({ canvasRef, mainLoader, onCanvasChange, badgeType }) => {
	const [templatesData, setTemplatesData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [userData, setUserData] = useState([]);
	const [designCode, setDesignCode] = useState("");
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
					.catch(() => {
						message.error('Unable to load badge assets.');
						setLoading(false);
					});

			})
			.catch(() => {
				message.error('Unable to start designer session.');
				setLoading(false);
			});
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
					if(badgeType === "template"){
						canvasRef.handler.clear(true);
					}
					objects.unshift(CONSTANTS.JSON_CONSTANT.BADGE);
					if (objects && Array.isArray(objects)) {
						setTimeout(() => {
							canvasRef.handler.importJSON(objects);
							onCanvasChange(true);
						}, 50);
					} else {
						message.error('Badge asset data is invalid.');
					}
				} catch (error) {
					message.error('Unable to load selected badge asset.');
				}

				mainLoader(false);
			})
			.catch(() => {
				message.error('Unable to load selected badge asset.');
				mainLoader(false);
			});
	}

	const visibleTemplates = templatesData.filter(template => {
		const term = query.trim().toLowerCase();
		if (!term) return true;
		return `${template.name || ''} ${template.TemplateName || ''} ${template.type || ''}`.toLowerCase().includes(term);
	});
	  
	  if (loading) {
		return <Spin size="large" className='loader-class'/>;
	}

	return (
		<div className="BadgeSection">
			<Input.Search
				allowClear
				placeholder={`Search ${badgeType === "template" ? "templates" : "shapes"}`}
				value={query}
				onChange={event => setQuery(event.target.value)}
				style={{ marginBottom: 12 }}
			/>

			{visibleTemplates && visibleTemplates.length > 0 && (
				<div  className="template-design">
					<Row className="template-row">
						<Col span={24}>
							<h3>{badgeType === "template"? "Template": ""} Shapes</h3>
						</Col>
					</Row>

					<Row>
						{visibleTemplates.map((item, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<div className={`${badgeType === "template"? "certificate-img1":"shape-img"}`}>
									<div className='shape-images'>
										<button
											type="button"
											className="template-card"
											onClick={() => handleTemplateClick(item)}
											aria-label={`Load badge ${badgeType === "template" ? "template" : "shape"} ${imgIndex + 1}`}
										>
											<img
												src={item.imageLink}
												className="template-img"
												loading="lazy"
												alt={`Template Badge Image ${imgIndex + 1}`}
											/>
										</button>
									</div>
								</div>
							</Col>
						))}
					</Row>
				</div>
			)}
			{visibleTemplates.length === 0 && (
				<Row className="template-row">
					<Col span={24}>
						<h3>{query ? 'No badge assets match your search.' : `No ${badgeType === "template"? "templates":"shapes"} available.`}</h3>
					</Col>
				</Row>
			)}
		</div>
	);
};

export default BadgeBackground;
