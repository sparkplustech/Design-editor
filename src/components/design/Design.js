import React, { useState } from 'react';
import { Row, Col } from 'antd';
import './DesignStyle.less';

const Design = () => {
	const [selectedDesign, setSelectedDesign] = useState(null);

	const designs = [
		{
			name: 'Designs',
			className: 'certificate-img1',
			images: [
				'https://marketplace.canva.com/EAE74fTSypY/1/0/1600w/canva-gold-elegant-certificate-of-achievement-template-8_WfTWrNJaI.jpg',
				'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/certificate-of-appreciation-design-template-7289b7fef37b1bda2dc3527df90bfe87_screen.jpg?ts=1703360539',
				'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/professional-certificate-design-template-c78dfc41d0402fe6793e854a4354affd_screen.jpg?ts=1698205825',
				'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/certificate-design-template-4185c55703afd57c4190a86c04f9e04e_screen.jpg?ts=1698395843',
				'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/certificate-of-appreciation-design-template-75a5cd2b0b64c4b15f82638b4e5548b8_screen.jpg?ts=1663583139',
				'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/certificate-of-achievement-design-template-a1c3c92be2553dc85c0bdc0141bc0002_screen.jpg?ts=1666177878',
			],
		},
	];

	const handleSeeAllClick = designIndex => {
		setSelectedDesign(designs[designIndex]);
	};

	const handleBackClick = () => {
		setSelectedDesign(null);
	};

	return (
		<div className="DesignsSection">
			{!selectedDesign &&
				designs.map((design, index) => (
					<div key={index} className="design">
						<Row className="design-row">
							<Col span={18}>
								<h3>{design.name}</h3>
							</Col>
							<Col span={6}>
								<span onClick={() => handleSeeAllClick(index)}>See All</span>
							</Col>
						</Row>

						<Row>
							{design.images.slice(0, 2).map((image, imgIndex) => (
								<Col key={imgIndex} span={12}>
									<div className={design.className}>
										<img
											src={image}
											className="design-img"
											alt={`Design ${index + 1} Image ${imgIndex + 1}`}
										/>
									</div>
								</Col>
							))}
						</Row>
					</div>
				))}

			{selectedDesign && (
				<div className="design-all">
					<Row className="design-row">
						<Col span={8}>
							<span onClick={handleBackClick}>All Design</span>
						</Col>
						<Col span={16}>
							<h3>{selectedDesign.name}</h3>
						</Col>
					</Row>

					<Row>
						{selectedDesign.images.map((image, imgIndex) => (
							<Col key={imgIndex} span={12}>
								<div className={selectedDesign.className}>
									<img
										src={image}
										className="design-img"
										alt={`Design ${index + 1} Image ${imgIndex + 1}`}
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

export default Design;
