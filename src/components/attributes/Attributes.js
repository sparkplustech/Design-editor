import React from 'react';
import { Row, Col, Divider } from 'antd';

const Attributes = () => {
	return (
		<Row className="panel-space">
			<Col>
				<h4 className="main-attribute">Issuer</h4>
				<p className="sub-attribute">Issuer Name</p>
				<Divider />
				<h4 className='main-attribute'>Group</h4>
				<p className="sub-attribute">Course Name</p>
				<p className="sub-attribute">Course Description</p>
				<Divider />
				<h4 className="main-attribute"> Credential</h4>
				<p className="sub-attribute">Credential ID </p>
				<p className="sub-attribute">Credential License ID </p>
				<p className="sub-attribute">Issue Date </p>
				<p className="sub-attribute"> Expiry Date </p>
				<p className="sub-attribute">Grade </p>
				<p className="sub-attribute"> URL</p>
				<p className="sub-attribute"> UUID</p>
				<Divider />
				<h4 className="main-attribute">Recipient</h4>
				<p className="sub-attribute">Recipient ID </p>
				<p className="sub-attribute"> Recipient Name </p>
				<p className="sub-attribute"> Recipient Email</p>
			</Col>
		</Row>
	);
};

export default Attributes;
