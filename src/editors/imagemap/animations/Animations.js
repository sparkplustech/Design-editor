import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form, Button } from 'antd';
import i18n from 'i18next';

import { Flex } from '../../../components/flex';
import AnimationList from './AnimationList';
import AnimationModal from './AnimationModal';
import Icon from '../../../components/icon/Icon';
import Scrollbar from '../../../components/common/Scrollbar';

const initialAnimation = {
	type: 'none',
	loop: true,
	autoplay: true,
	delay: 100,
	duration: 1000,
};

class Animations extends Component {
	static propTypes = {
		animations: PropTypes.array,
		onChangeAnimations: PropTypes.func,
	};

	static defaultProps = {
		animations: [],
	};

	state = {
		animation: initialAnimation,
		visible: false,
		validateTitle: {
			validateStatus: '',
			help: '',
		},
		current: 'add',
	};

	handlers = {
		onOk: () => {
			if (this.state.validateTitle.validateStatus === 'error') {
				return;
			}
			if (!this.state.animation.title) {
				this.setState({
					validateTitle: this.handlers.onValid(),
				});
				return;
			}
			let nextAnimation = {
				...this.state.animation,
				type: this.state.animation.type || 'none',
			};
			let nextAnimations = [...this.props.animations];
			if (Object.keys(this.state.animation).length === 2) {
				this.modalRef.validateFields((err, values) => {
					nextAnimation = { ...nextAnimation, ...values.animation };
				});
			}
			if (this.state.current === 'add') {
				nextAnimations = [...nextAnimations, nextAnimation];
			} else {
				nextAnimations = nextAnimations.map((animation, index) =>
					index === this.state.index ? nextAnimation : animation,
				);
			}
			this.setState(
				{
					visible: false,
					animation: {},
				},
				() => {
					this.props.onChangeAnimations(nextAnimations);
				},
			);
		},
		onCancel: () => {
			this.setState({
				visible: false,
				animation: initialAnimation,
				validateTitle: {
					validateStatus: '',
					help: '',
				},
			});
		},
		onAdd: () => {
			this.setState({
				visible: true,
				animation: { ...initialAnimation },
				validateTitle: {
					validateStatus: '',
					help: '',
				},
				current: 'add',
			});
		},
		onEdit: (animation, index) => {
			this.setState({
				visible: true,
				animation: { ...animation },
				validateTitle: {
					validateStatus: '',
					help: '',
				},
				current: 'modify',
				index,
			});
		},
		onDelete: index => {
			this.props.onChangeAnimations(
				this.props.animations.filter((animation, animationIndex) => animationIndex !== index),
			);
		},
		onClear: () => {
			this.props.onChangeAnimations([]);
		},
		onChange: (props, changedValues, allValues) => {
			const fields = changedValues[Object.keys(changedValues)[0]];
			const field = Object.keys(fields)[0];
			const isTitle = field === 'title';
			if (isTitle) {
				this.setState({
					validateTitle: this.handlers.onValid(fields[field]),
				});
			}
			this.setState({
				animation: {
					title: this.state.animation.title,
					...initialAnimation,
					...allValues[Object.keys(allValues)[0]],
				},
			});
		},
		onValid: value => {
			if (!value || !value.length) {
				return {
					validateStatus: 'error',
					help: i18n.t('validation.enter-property', { arg: i18n.t('common.title') }),
				};
			}
			const exist = this.props.animations.some((animation, index) => {
				if (this.state.current === 'modify' && index === this.state.index) {
					return false;
				}
				return animation.title === value;
			});
			if (!exist) {
				return {
					validateStatus: 'success',
					help: '',
				};
			}
			return {
				validateStatus: 'error',
				help: i18n.t('validation.already-property', { arg: i18n.t('common.title') }),
			};
		},
	};

	render() {
		const { animations } = this.props;
		const { visible, animation, validateTitle } = this.state;
		const { onOk, onCancel, onAdd, onEdit, onDelete, onClear, onChange, onValid } = this.handlers;
		return (
			<Scrollbar>
				<Form>
					<Flex flexDirection="column">
						<Flex justifyContent="flex-end" style={{ padding: 8 }}>
							<Button aria-label="Add animation" className="rde-action-btn" shape="circle" title="Add animation" onClick={onAdd}>
								<Icon name="plus" />
							</Button>
							<Button
								aria-label="Clear animations"
								className="rde-action-btn"
								shape="circle"
								title="Clear animations"
								onClick={onClear}
							>
								<Icon name="times" />
							</Button>
							<AnimationModal
								ref={c => {
									this.modalRef = c;
								}}
								validateTitle={validateTitle}
								visible={visible}
								onOk={onOk}
								animation={animation}
								onCancel={onCancel}
								onChange={onChange}
								onValid={onValid}
							/>
						</Flex>
						<AnimationList animations={animations} onEdit={onEdit} onDelete={onDelete} />
					</Flex>
				</Form>
			</Scrollbar>
		);
	}
}

export default Animations;
