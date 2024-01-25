import React, { useState } from 'react';
import { Row, Col } from 'antd';
import './TemplatesStyle.less';

const Templates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
    {
      name: 'Template 1',
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
    {
      name: 'Template 2',
	  className: 'certificate-img2',
      images: [
        'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/professional-certificate-design-template-4254ea04a125ef966275ba8a70817f7c_screen.jpg?ts=1688134083',
        'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/certificate-of-appreciation-design-template-5b695a00b1a6af8a882d89ab5cc3c38c_screen.jpg?ts=1661181948',
		'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/certificate-of-achievement-design-template-d1fe4129d4d7b0d564a347a2997bedef_screen.jpg?ts=1661180198',
		'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/certificate-design-template-6f6b2ce4ff69a8c76ebf481f446b5b52_screen.jpg?ts=1698907497',
		'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/professional-certificate-design-template-98d548c637a449f2622a310201f7f8f4_screen.jpg?ts=1687862101',
		'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/vertical-certificate-of-appreciation-template-design-2c5f848bd264516b4f3cda4df9d3f6fd_screen.jpg?ts=1672663137',
      ],
    },
  ];

  const handleSeeAllClick = (templateIndex) => {
    setSelectedTemplate(templates[templateIndex]);
  };

  const handleBackClick = () => {
    setSelectedTemplate(null);
  };

  return (
    <div className="TemplatesSection">
      {!selectedTemplate &&
        templates.map((template, index) => (
          <div key={index} className="template-design">
            <Row className="template-row">
              <Col span={18}>
                <h3>{template.name}</h3>
              </Col>
              <Col span={6}>
                <span onClick={() => handleSeeAllClick(index)}>See All</span>
              </Col>
            </Row>

            <Row>
              {template.images.slice(0,2).map((image, imgIndex) => (
                <Col key={imgIndex} span={12}>
                  <img src={image} className={template.className} alt={`Template ${index + 1} Image ${imgIndex + 1}`} />
                </Col>
              ))}
            </Row>
          </div>
        ))}

      {selectedTemplate && (
        <div className="template-design-all">
          <Row className="template-row">
            <Col span={8}>
              <span onClick={handleBackClick}>All Templates</span>
            </Col>
            <Col span={16}>
              <h3>{selectedTemplate.name}</h3>
            </Col>
          </Row>

          <Row>
            {selectedTemplate.images.map((image, imgIndex) => (
              <Col key={imgIndex} span={12}>
                <img src={image} className={selectedTemplate.className} alt={`Template ${imgIndex + 1}`} />
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export default Templates;
