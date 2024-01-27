import React, { useState } from 'react';
import { Row, Col } from 'antd';
import './TemplatesStyle.less';

const Templates = ({canvasRef}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
 

  const templates = [
    {
      name: 'Template 1',
	  className: 'certificate-img1',
      images: [
        {thumbnail: 'https://marketplace.canva.com/EAE74fTSypY/1/0/1600w/canva-gold-elegant-certificate-of-achievement-template-8_WfTWrNJaI.jpg',
        templatelink:'https://hirefullstackdevelopersindia.com/testfile/sample (3).json'
      },
      {thumbnail: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/certificate-of-appreciation-design-template-7289b7fef37b1bda2dc3527df90bfe87_screen.jpg?ts=1703360539',
      templatelink:'https://hirefullstackdevelopersindia.com/testfile/sample (4).json'
    },
    {thumbnail: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/professional-certificate-design-template-c78dfc41d0402fe6793e854a4354affd_screen.jpg?ts=1698205825',
    templatelink:'https://hirefullstackdevelopersindia.com/testfile/sample (5).json'
  }
  ,
  {thumbnail: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/certificate-design-template-4185c55703afd57c4190a86c04f9e04e_screen.jpg?ts=1698395843',
  templatelink:'https://hirefullstackdevelopersindia.com/testfile/sample (6).json'
},
{thumbnail: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/certificate-of-appreciation-design-template-75a5cd2b0b64c4b15f82638b4e5548b8_screen.jpg?ts=1663583139',
templatelink:'https://hirefullstackdevelopersindia.com/testfile/sample (7).json'
}
   
 ],
    },
    {
      name: 'Template 2',
	  className: 'certificate-img2',
      images: [

        {thumbnail: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/professional-certificate-design-template-4254ea04a125ef966275ba8a70817f7c_screen.jpg?ts=1688134083',
        templatelink:'https://hirefullstackdevelopersindia.com/testfile/sample (3).json'
      },
      {thumbnail: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/certificate-of-appreciation-design-template-5b695a00b1a6af8a882d89ab5cc3c38c_screen.jpg?ts=1661181948',
      templatelink:'https://hirefullstackdevelopersindia.com/testfile/sample (4).json'
    },
    {thumbnail: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/certificate-of-achievement-design-template-d1fe4129d4d7b0d564a347a2997bedef_screen.jpg?ts=1661180198',
    templatelink:'https://hirefullstackdevelopersindia.com/testfile/sample (5).json'
  }
  ,
  {thumbnail: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/certificate-design-template-6f6b2ce4ff69a8c76ebf481f446b5b52_screen.jpg?ts=1698907497',
  templatelink:'https://hirefullstackdevelopersindia.com/testfile/sample (6).json'
},
{thumbnail: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/vertical-certificate-of-appreciation-template-design-2c5f848bd264516b4f3cda4df9d3f6fd_screen.jpg?ts=1672663137',
templatelink:'https://hirefullstackdevelopersindia.com/testfile/sample (7).json'
}
 
      ],
    },
  ];

	const handleSeeAllClick = (templateIndex) => {
		setSelectedTemplate(templates[templateIndex]);
	};

	const handleBackClick = () => {
		setSelectedTemplate(null);
	};


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
                  <div className={template.className}>
                  <img src={image.thumbnail} onClick={handleTemplateClick} className="template-img" alt={`Template ${index + 1} Image ${imgIndex + 1}`} />
                  </div>
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
								<div className={selectedTemplate.className}>
										<img
											src={image.thumbnail}
                      onClick={handleTemplateClick}
											className="template-img"
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

export default Templates;
