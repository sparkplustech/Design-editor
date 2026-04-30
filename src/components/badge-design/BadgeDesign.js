import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Input, message } from 'antd';
import '../badge-background/BadgeBackgroundStyle.less';
import CONSTANTS from '../../../constant';
import {
	authHeaders,
	fetchDesignerJson,
	getCanvasObjects,
	isOptionalDesignerSessionError,
	loadDesignerSession,
} from '../../utils/designerApi';

const BadgeDesign = ({ canvasRef, mainLoader, onCanvasChange }) => {
	const [templatesData, setTemplatesData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [userData, setUserData] = useState(null);
	const [query, setQuery] = useState('');

	useEffect(() => {
		let isMounted = true;

		const loadBadgeDesigns = async () => {
			try {
				const session = await loadDesignerSession();
				const data = await fetchDesignerJson('/templates/getalluserbadgeTemplates', {
					headers: authHeaders(session.accessToken),
				});

				if (!isMounted) return;

				setUserData(session);
				setTemplatesData(data || {});
			} catch (error) {
				if (!isMounted) return;
				if (!isOptionalDesignerSessionError(error)) {
					message.error('Unable to load badge designs.');
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		loadBadgeDesigns();

		return () => {
			isMounted = false;
		};
	}, []);

	async function handleTemplateClick(tempdata) {
		if (!userData?.accessToken) {
			message.error('Designer session expired. Refresh and try again.');
			return;
		}

		mainLoader(true);

		try {
			const data = await fetchDesignerJson(`/templates/getuserBadgeTemplate/${tempdata?.id}`, {
				headers: authHeaders(userData.accessToken),
			});
			const objects = getCanvasObjects(data?.templateCode);
			const importObjects = [CONSTANTS.JSON_CONSTANT.BADGE, ...objects];

			canvasRef.handler.clear(true);
			setTimeout(() => {
				canvasRef.handler.importJSON(importObjects);
				onCanvasChange(true);
			}, 50);
		} catch (error) {
			message.error('Unable to load selected badge template.');
		} finally {
			mainLoader(false);
		}
	}

	const visibleTemplates = (templatesData?.badges || []).filter(template => {
		const term = query.trim().toLowerCase();
		if (!term) return true;
		return `${template.name || ''} ${template.TemplateName || ''}`.toLowerCase().includes(term);
	});

	if (loading) {
		return <Spin size="large" className="loader-class" />;
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
				<div className="template-design">
					<Row className="template-row">
						<Col span={24}>
							<h3>Template Designs</h3>
						</Col>
					</Row>

					<Row>
						{visibleTemplates.map((item, imgIndex) => (
							<Col key={item.id || imgIndex} span={12}>
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
			) : (
				<div className="designer-panel-empty">
					<div className="designer-panel-empty-title">
						{query ? 'No badge designs match your search.' : 'No badge designs yet.'}
					</div>
					<div className="designer-panel-empty-copy">
						Start from Templates or add badge shapes from Components.
					</div>
				</div>
			)}
		</div>
	);
};

export default BadgeDesign;
