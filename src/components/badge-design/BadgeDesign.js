import React, { useState } from 'react';
import { Row, Col } from 'antd';
import '../badge-background/BadgeBackgroundStyle.less';

const BadgeDesign = ({ canvasRef }) => {

	const templates = [
		{
			name: 'Template Designs',
			className: 'certificate-img1',
			images: [
				{
					thumbnail:
						'https://png2.cleanpng.com/sh/390ea4f1cba5d12b69cafec59728dea7/L0KzQYi4UcI4N2g2eZGAYUHmdIrrVcU4O2loS5CCOEi1SYG4VcE2OWI9TKI7MUO2RYi6TwBvbz==/5a1cd9d55738c3.7882901515118402133573.png',
					templatelink: 'https://hirefullstackdevelopersindia.com/testfile/sample (3).json',
				},
			],
		},
	];

	function handleTemplateClick() {
		fetch('https://hirefullstackdevelopersindia.com/testfile/sample (6).json')
			.then(response => response.json())
			.then(data => {
				// Assuming data contains fabric.js objects or object data
				canvasRef.handler.importJSON(data.objects);
			})
			.catch(error => console.error('Error fetching JSON:', error));
	}
	return (
		<div className="BadgeSection">
			{templates.map((template, index) => (
				<div key={index} className="template-design">
					<Row className="template-row">
						<Col span={24}>
							<h3>{template.name}</h3>
						</Col>
					</Row>

					<Row>
						{template.images.map((image, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<div className="certificate-img1">
									<img
										src={image.thumbnail}
										onClick={handleTemplateClick}
										className="template-img"
										alt={`Template ${index + 1} Image ${imgIndex + 1}`}
									/>
								</div>
							</Col>
						))}
					</Row>
				</div>
			))}
		</div>
	);
};

export default BadgeDesign;
