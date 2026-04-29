import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Input, message } from 'antd';
import './BadgeBackgroundStyle.less';
import CONSTANTS from '../../../constant';
import { authHeaders, fetchDesignerJson, getCanvasObjects, loadDesignerSession } from '../../utils/designerApi';

const BadgeBackground = ({ canvasRef, mainLoader, onCanvasChange, badgeType }) => {
	const [templatesData, setTemplatesData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [userData, setUserData] = useState(null);
	const [query, setQuery] = useState('');

	useEffect(() => {
		let isMounted = true;

		const loadBadgeAssets = async () => {
			try {
				const session = await loadDesignerSession();
				const data = await fetchDesignerJson('/templates/getAllBadgeTemplates', {
					headers: authHeaders(session.accessToken),
				});

				if (!isMounted) return;

				const badges = Array.isArray(data?.badges) ? data.badges : [];
				const background = badges.filter(template => template.type !== 'template');
				const templates = badges.filter(template => template.type === 'template');

				setUserData(session);
				setTemplatesData(badgeType === 'template' ? templates : background);
			} catch (error) {
				if (!isMounted) return;
				message.error('Unable to load badge assets.');
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		loadBadgeAssets();

		return () => {
			isMounted = false;
		};
	}, [badgeType]);

	async function handleTemplateClick(tempdata) {
		if (!userData?.accessToken) {
			message.error('Designer session expired. Refresh and try again.');
			return;
		}

		mainLoader(true);

		try {
			const data = await fetchDesignerJson(`/templates/getBadgeTemplate/${tempdata?.id}`, {
				headers: authHeaders(userData.accessToken),
			});
			const objects = getCanvasObjects(data?.templateCode);
			const importObjects = [CONSTANTS.JSON_CONSTANT.BADGE, ...objects];

			if (badgeType === 'template') {
				canvasRef.handler.clear(true);
			}

			setTimeout(() => {
				canvasRef.handler.importJSON(importObjects);
				onCanvasChange(true);
			}, 50);
		} catch (error) {
			message.error('Unable to load selected badge asset.');
		} finally {
			mainLoader(false);
		}
	}

	const visibleTemplates = templatesData.filter(template => {
		const term = query.trim().toLowerCase();
		if (!term) return true;
		return `${template.name || ''} ${template.TemplateName || ''} ${template.type || ''}`.toLowerCase().includes(term);
	});

	if (loading) {
		return <Spin size="large" className="loader-class" />;
	}

	return (
		<div className="BadgeSection">
			<Input.Search
				allowClear
				placeholder={`Search ${badgeType === 'template' ? 'templates' : 'shapes'}`}
				value={query}
				onChange={event => setQuery(event.target.value)}
				style={{ marginBottom: 12 }}
			/>

			{visibleTemplates.length > 0 && (
				<div className="template-design">
					<Row className="template-row">
						<Col span={24}>
							<h3>{badgeType === 'template' ? 'Template' : ''} Shapes</h3>
						</Col>
					</Row>

					<Row>
						{visibleTemplates.map((item, imgIndex) => (
							<Col key={item.id || imgIndex} span={12}>
								<div className={badgeType === 'template' ? 'certificate-img1' : 'shape-img'}>
									<div className="shape-images">
										<button
											type="button"
											className="template-card"
											onClick={() => handleTemplateClick(item)}
											aria-label={`Load badge ${badgeType === 'template' ? 'template' : 'shape'} ${imgIndex + 1}`}
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
						<h3>{query ? 'No badge assets match your search.' : `No ${badgeType === 'template' ? 'templates' : 'shapes'} available.`}</h3>
					</Col>
				</Row>
			)}
		</div>
	);
};

export default BadgeBackground;
