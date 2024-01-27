import React, { useState } from 'react';
import { Row, Col } from 'antd';
import './BadgeBackgroundStyle.less';

const BadgeBackground = ({ canvasRef }) => {

	const templates = [
		{
			name: 'Background Shapes',
			className: 'certificate-img1',
			images: [
				{
					thumbnail:
						'https://png2.cleanpng.com/sh/390ea4f1cba5d12b69cafec59728dea7/L0KzQYi4UcI4N2g2eZGAYUHmdIrrVcU4O2loS5CCOEi1SYG4VcE2OWI9TKI7MUO2RYi6TwBvbz==/5a1cd9d55738c3.7882901515118402133573.png',
					templatelink: 'https://hirefullstackdevelopersindia.com/testfile/sample (3).json',
				},
				{
					thumbnail:
						'https://png2.cleanpng.com/sh/12e318dad91364e7254acc8bbed03983/L0KzQoG4UMEyN5RtjZH9cnHxg8HokvVvfF5mj9N7ZD3lcbXuhb02bmk4SdMEYUblQLTpWb4xPWc5SaIANUG5QIO7Usc2PGc5S6oALoDxd1==/transparent-award-badge-5f831a9a6b0cb9.0564105516024275464385.png',
					templatelink: 'https://hirefullstackdevelopersindia.com/testfile/sample (4).json',
				},
				{
					thumbnail:
						'https://png2.cleanpng.com/sh/0ce2d65d3daa32b4f747f208a1375a37/L0KzQoG4UMEyN6p9f5H9cnHxg8HokvVvfF5mj9N7ZD3lcbXuhb02bmk4SNVuMkGzRIrrWL45OWo4TaYAMEG5QIO7UsQxO2U1TqgCLoDxd1==/transparent-award-badge-5f830ce21049d8.8193545016024240340667.png',
					templatelink: 'https://hirefullstackdevelopersindia.com/testfile/sample (5).json',
				},
				{
					thumbnail:
						'https://png2.cleanpng.com/sh/c2646305bbe763ed9c75eadfad5dd24e/L0KzQoG4UMEyN6d1hJH9cnHxg8HokvVvfF54gd5BZYKwcrLrhBUuaahmitY2YnHnd7a0VfY5O2o4fdZrNnazQoi1WcIzOWc3SaM6NkC1RIaBVsA2P2UAS5D5bne=/transparent-silver-badge-award-badge-5f8393edb6f027.9221621116024586057493.png',
					templatelink: 'https://hirefullstackdevelopersindia.com/testfile/sample (6).json',
				},
				{
					thumbnail:
						'https://png2.cleanpng.com/sh/dcadc957e582780a3f47bcfddbfe91f7/L0KzQYi4UcI5N2hoTJGAYUHnQbW6UsUzQGhoSJC9OEW8QIq4WME2OWI9Tak9NUi2Q4m4TwBvbz==/5a1d1d325287c0.4859091815118574583381.png',
					templatelink: 'https://hirefullstackdevelopersindia.com/testfile/sample (7).json',
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

export default BadgeBackground;
