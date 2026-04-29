import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Input, message } from 'antd';
import '../badge-background/BadgeBackgroundStyle.less';
import CONSTANTS from '../../../constant';

const BadgeDesign = ({ canvasRef, mainLoader, onCanvasChange }) => {
	const [templatesData, setTemplatesData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [designCode, setDesignCode] = useState("");
	const [userData, setUserData] = useState("");
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
					.catch(() => {
						message.error('Unable to load badge templates.');
						setLoading(false);
					});
			})
			.catch(() => {
				message.error('Unable to start badge designer session.');
				setLoading(false);
			});

	}, []);

	function handleTemplateClick(tempdata) {
		mainLoader(true);
		fetch(`${CONSTANTS.API_CONSTANT.REACT_APP_API_BASE_URL}/templates/getuserBadgeTemplate/${tempdata?.id}`, {
			headers: {
				Authorization: `Bearer ${userData.accessToken}`,
			},
		})
			.then(response => response.json())
			.then(data => {
				try {
					const objects = data?.templateCode?.objects;
					canvasRef.handler.clear(true);
					objects.unshift(CONSTANTS.JSON_CONSTANT.BADGE);
					if (objects && Array.isArray(objects)) {
						setTimeout(() => {
							canvasRef.handler.importJSON(objects);
							onCanvasChange(true);
						}, 50);
					} else {
						message.error('Badge template data is invalid.');
					}
				} catch (error) {
					message.error('Unable to load selected badge template.');
				}

				mainLoader(false);
			})
			.catch(() => {
				message.error('Unable to load selected badge template.');
				mainLoader(false);
			});
	}

	const visibleTemplates = (templatesData?.badges || []).filter(template => {
		const term = query.trim().toLowerCase();
		if (!term) return true;
		return `${template.name || ''} ${template.TemplateName || ''}`.toLowerCase().includes(term);
	});
	  
	  if (loading) {
		return <Spin size="large" className='loader-class'/>;
	}

	return (
		<div className="BadgeSection">
			<Input.Search
				allowClear
				placeholder="Search badge designs"
				value={query}
				onChange={event => setQuery(event.target.value)}
				style={{ marginBottom: 12 }}
			/>

			{visibleTemplates.length > 0 ? (
				<div  className="template-design">
					<Row className="template-row">
						<Col span={24}>
							<h3>Template Designs</h3>
						</Col>
					</Row>

					<Row>
						{visibleTemplates.map((item, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<div className="certificate-img1">
									<button
										type="button"
										className="template-card"
										onClick={() => handleTemplateClick(item)}
										aria-label={`Load badge design ${imgIndex + 1}`}
									>
										<img
											src={item.imageLink}
											className="template-img"
											loading="lazy"
											alt={`Template Badge Image ${imgIndex + 1}`}
										/>
									</button>
								</div>
							</Col>
						))}
					</Row>
				</div>
			): (
				<Row className="template-row">
						<Col span={24}>
							<h3>{query ? 'No badge designs match your search.' : 'No designs available.'}</h3>
						</Col>
					</Row>
			)}
		</div>
	);
};

export default BadgeDesign;
