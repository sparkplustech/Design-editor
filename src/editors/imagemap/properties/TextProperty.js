import React from 'react';
import { Form, Slider, Row, Col, Select, InputNumber, Radio } from 'antd';
import sortBy from 'lodash/sortBy';

import AccessibleCheckableTag from '../../../components/common/AccessibleCheckableTag';
import Icon from '../../../components/icon/Icon';
import Fonts from '../../../components/font/fonts';

const fonts = Fonts.getFonts();

export default {
	render(canvasRef, form, data) {
		const { getFieldDecorator } = form;
		return (
			<React.Fragment>
				<Row gutter={8}>
					<Col span={16}>
						<Form.Item label="Font Family" colon={false}>
							{getFieldDecorator('fontFamily', {
								initialValue: data.fontFamily || 'Arial',
							})(
								<Select showSearch optionFilterProp="children" className="text-control-full">
									{Object.keys(fonts).map(font => {
										return (
											<Select.OptGroup key={font} label={font.toUpperCase()}>
												{sortBy(fonts[font], ['name']).map(f => (
													<Select.Option key={f.name} value={f.name}>
														{f.name}
													</Select.Option>
												))}
											</Select.OptGroup>
										);
									})}
								</Select>,
							)}
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item label="Size" colon={false}>
							{getFieldDecorator('fontSize', {
								initialValue: Number(data.fontSize) || 32,
							})(<InputNumber className="text-control-full" min={6} max={240} step={1} />)}
						</Form.Item>
					</Col>
				</Row>
				<div className="text-control-row">
					<div className="text-control-label">Style</div>
					<Row gutter={6} className="text-toggle-group">
						<Col span={6}>
							<Form.Item className="text-toggle-item">
								{getFieldDecorator('fontWeight', {
									valuePropName: 'checked',
									initialValue: data.fontWeight === 'bold',
								})(
									<AccessibleCheckableTag label="Bold">
										<Icon name="bold" />
									</AccessibleCheckableTag>,
								)}
							</Form.Item>
						</Col>
						<Col span={6}>
							<Form.Item className="text-toggle-item">
								{getFieldDecorator('fontStyle', {
									valuePropName: 'checked',
									initialValue: data.fontStyle === 'italic',
								})(
									<AccessibleCheckableTag label="Italic">
										<Icon name="italic" />
									</AccessibleCheckableTag>,
								)}
							</Form.Item>
						</Col>
						<Col span={6}>
							<Form.Item className="text-toggle-item">
								{getFieldDecorator('underline', {
									valuePropName: 'checked',
									initialValue: data.underline,
								})(
									<AccessibleCheckableTag label="Underline">
										<Icon name="underline" />
									</AccessibleCheckableTag>,
								)}
							</Form.Item>
						</Col>
						<Col span={6}>
							<Form.Item className="text-toggle-item">
								{getFieldDecorator('linethrough', {
									valuePropName: 'checked',
									initialValue: data.linethrough,
								})(
									<AccessibleCheckableTag label="Strikethrough">
										<Icon name="strikethrough" />
									</AccessibleCheckableTag>,
								)}
							</Form.Item>
						</Col>
					</Row>
				</div>
				<Form.Item label="Alignment" colon={false}>
					{getFieldDecorator('textAlign', {
						initialValue: data.textAlign || 'left',
					})(
						<Radio.Group className="text-align-group">
							<Radio.Button aria-label="Align left" title="Align left" value="left">
								<Icon name="align-left" />
							</Radio.Button>
							<Radio.Button aria-label="Align center" title="Align center" value="center">
								<Icon name="align-center" />
							</Radio.Button>
							<Radio.Button aria-label="Align right" title="Align right" value="right">
								<Icon name="align-right" />
							</Radio.Button>
							<Radio.Button aria-label="Justify text" title="Justify text" value="justify">
								<Icon name="align-justify" />
							</Radio.Button>
						</Radio.Group>,
					)}
				</Form.Item>
				<Row gutter={12}>
					<Col span={12}>
						<Form.Item label="Line Height" colon={false}>
							{getFieldDecorator('lineHeight', {
								rules: [
									{
										type: 'number',
									},
								],
								initialValue: Number(data.lineHeight) || 1.16,
							})(<Slider min={0.8} max={3} step={0.05} />)}
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item label="Letter Spacing" colon={false}>
							{getFieldDecorator('charSpacing', {
								rules: [
									{
										type: 'number',
									},
								],
								initialValue: Number(data.charSpacing) || 0,
							})(<Slider min={-100} max={800} step={10} />)}
						</Form.Item>
					</Col>
				</Row>
			</React.Fragment>
		);
	},
};
