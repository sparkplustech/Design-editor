import React from 'react';
import { Row, Col, Form, Slider } from 'antd';
import i18n from 'i18next';

import AccessibleCheckableTag from '../../../components/common/AccessibleCheckableTag';

export default {
	render(canvasRef, form, data) {
		const { getFieldDecorator } = form;
		const { filters } = data;
		return (
			<Row>
				<Row style={{ marginTop: '5px' }}>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.grayscale')}>
							{getFieldDecorator('filters.grayscale', {
								valuePropName: 'checked',
								initialValue: !!filters[0],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.grayscale')}>{'G'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.invert')}>
							{getFieldDecorator('filters.invert', {
								valuePropName: 'checked',
								initialValue: !!filters[1],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.invert')}>{'I'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.sepia')}>
							{getFieldDecorator('filters.sepia', {
								valuePropName: 'checked',
								initialValue: !!filters[3],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.sepia')}>{'S'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.brownie')}>
							{getFieldDecorator('filters.brownie', {
								valuePropName: 'checked',
								initialValue: !!filters[4],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.brownie')}>{'B'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
				</Row>
				<Row style={{ marginTop: '10px' }}>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.vintage')}>
							{getFieldDecorator('filters.vintage', {
								valuePropName: 'checked',
								initialValue: !!filters[9],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.vintage')}>{'V'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.blackwhite')}>
							{getFieldDecorator('filters.blackwhite', {
								valuePropName: 'checked',
								initialValue: !!filters[19],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.blackwhite')}>{'B'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.technicolor')}>
							{getFieldDecorator('filters.technicolor', {
								valuePropName: 'checked',
								initialValue: !!filters[14],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.technicolor')}>{'T'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.polaroid')}>
							{getFieldDecorator('filters.polaroid', {
								valuePropName: 'checked',
								initialValue: !!filters[15],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.polaroid')}>{'P'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
				</Row>
				<Row style={{ marginTop: '10px' }}>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.sharpen')}>
							{getFieldDecorator('filters.sharpen', {
								valuePropName: 'checked',
								initialValue: !!filters[12],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.sharpen')}>{'S'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.emboss')}>
							{getFieldDecorator('filters.emboss', {
								valuePropName: 'checked',
								initialValue: !!filters[13],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.emboss')}>{'E'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
				</Row>
				<Row style={{ marginTop: '10px' }}>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.gamma')}>
							{getFieldDecorator('filters.gamma.enabled', {
								valuePropName: 'checked',
								initialValue: !!filters[17],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.gamma')}>{'G'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('color.red')}>
							{getFieldDecorator('filters.gamma.r', {
								initialValue: filters[17] ? filters[17].gamma[0] : 1,
							})(<Slider disabled={!filters[17]} step={0.01} min={0.01} max={2.2} />)}
						</Form.Item>
					</Col>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('color.green')}>
							{getFieldDecorator('filters.gamma.g', {
								initialValue: filters[17] ? filters[17].gamma[1] : 1,
							})(<Slider disabled={!filters[17]} step={0.01} min={0.01} max={2.2} />)}
						</Form.Item>
					</Col>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('color.blue')}>
							{getFieldDecorator('filters.gamma.b', {
								initialValue: filters[17] ? filters[17].gamma[2] : 1,
							})(<Slider disabled={!filters[17]} step={0.01} min={0.01} max={2.2} />)}
						</Form.Item>
					</Col>
				</Row>
				<Row style={{ marginTop: '10px' }}>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.brightness')}>
							{getFieldDecorator('filters.brightness.enabled', {
								valuePropName: 'checked',
								initialValue: !!filters[5],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.brightness')}>{'B'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={18}>
						<Form.Item label={i18n.t('imagemap.filter.brightness')}>
							{getFieldDecorator('filters.brightness.brightness', {
								initialValue: filters[5] ? filters[5].brightness : 0.1,
							})(<Slider disabled={!filters[5]} step={0.01} min={-1} max={1} />)}
						</Form.Item>
					</Col>
				</Row>
				<Row style={{ marginTop: '10px' }}>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.contrast')}>
							{getFieldDecorator('filters.contrast.enabled', {
								valuePropName: 'checked',
								initialValue: !!filters[6],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.contrast')}>{'C'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={18}>
						<Form.Item label={i18n.t('imagemap.filter.contrast')}>
							{getFieldDecorator('filters.contrast.contrast', {
								initialValue: filters[6] ? filters[6].contrast : 0,
							})(<Slider disabled={!filters[6]} step={0.01} min={-1} max={1} />)}
						</Form.Item>
					</Col>
				</Row>
				<Row style={{ marginTop: '10px' }}>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.saturation')}>
							{getFieldDecorator('filters.saturation.enabled', {
								valuePropName: 'checked',
								initialValue: !!filters[7],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.saturation')}>{'S'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={18}>
						<Form.Item label={i18n.t('imagemap.filter.saturation')}>
							{getFieldDecorator('filters.saturation.saturation', {
								initialValue: filters[7] ? filters[7].saturation : 0,
							})(<Slider disabled={!filters[7]} step={0.01} min={-1} max={1} />)}
						</Form.Item>
					</Col>
				</Row>
				<Row style={{ marginTop: '10px' }}>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.hue')}>
							{getFieldDecorator('filters.hue.enabled', {
								valuePropName: 'checked',
								initialValue: !!filters[21],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.hue')}>{'H'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={18}>
						<Form.Item label={i18n.t('imagemap.filter.hue')}>
							{getFieldDecorator('filters.hue.rotation', {
								initialValue: filters[21] ? filters[21].rotation : 0,
							})(<Slider disabled={!filters[21]} step={0.002} min={-2} max={2} />)}
						</Form.Item>
					</Col>
				</Row>
				<Row style={{ marginTop: '10px' }}>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.noise')}>
							{getFieldDecorator('filters.noise.enabled', {
								valuePropName: 'checked',
								initialValue: !!filters[8],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.noise')}>{'N'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={18}>
						<Form.Item label={i18n.t('imagemap.filter.noise')}>
							{getFieldDecorator('filters.noise.noise', {
								initialValue: filters[8] ? filters[8].noise : 100,
							})(<Slider disabled={!filters[8]} step={1} min={0} max={1000} />)}
						</Form.Item>
					</Col>
				</Row>
				<Row style={{ marginTop: '10px' }}>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.pixelate')}>
							{getFieldDecorator('filters.pixelate.enabled', {
								valuePropName: 'checked',
								initialValue: !!filters[10],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.pixelate')}>{'P'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={18}>
						<Form.Item label={i18n.t('imagemap.filter.pixelate')}>
							{getFieldDecorator('filters.pixelate.blocksize', {
								initialValue: filters[10] ? filters[10].blocksize : 4,
							})(<Slider disabled={!filters[10]} step={1} min={2} max={20} />)}
						</Form.Item>
					</Col>
				</Row>
				<Row style={{ marginTop: '10px' }}>
					<Col md={24} lg={6}>
						<Form.Item label={i18n.t('imagemap.filter.blur')}>
							{getFieldDecorator('filters.blur.enabled', {
								valuePropName: 'checked',
								initialValue: !!filters[11],
							})(<AccessibleCheckableTag label={i18n.t('imagemap.filter.blur')}>{'B'}</AccessibleCheckableTag>)}
						</Form.Item>
					</Col>
					<Col md={24} lg={18}>
						<Form.Item label={i18n.t('imagemap.filter.blur')}>
							{getFieldDecorator('filters.blur.value', {
								initialValue: filters[11] ? filters[11].value : 0.1,
							})(<Slider disabled={!filters[11]} step={0.01} min={0} max={1} />)}
						</Form.Item>
					</Col>
				</Row>
			</Row>
		);
	},
};
