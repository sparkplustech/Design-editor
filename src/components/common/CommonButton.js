import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Button } from 'antd';
import Icon from '../icon/Icon';

class CommonButton extends Component {
	static propTypes = {
		name: PropTypes.string,
		id: PropTypes.string,
		style: PropTypes.object,
		wrapperStyle: PropTypes.object,
		wrapperClassName: PropTypes.string,
		tooltipTitle: PropTypes.string,
		tooltipPlacement: PropTypes.string,
		className: PropTypes.string,
		icon: PropTypes.string,
		iconStyle: PropTypes.object,
		iconClassName: PropTypes.string,
		iconAnimation: PropTypes.string,
		visible: PropTypes.bool,
		shape: PropTypes.string,
		disabled: PropTypes.bool,
		ariaPressed: PropTypes.bool,
		loading: PropTypes.bool,
		type: PropTypes.string,
		iconType: PropTypes.oneOf(['fas', 'material']),
		ariaLabel: PropTypes.string,
	};

	static defaultProps = {
		type: 'default',
		visible: true,
		disabled: false,
		loading: false,
		iconType: 'fas',
	};

	render() {
		const buttonLabel = this.props.ariaLabel || this.props.tooltipTitle || this.props.name;
		const buttonProps = {
			'aria-label': buttonLabel,
			title: buttonLabel,
		};
		if (typeof this.props.ariaPressed === 'boolean') {
			buttonProps['aria-pressed'] = this.props.ariaPressed;
		}
		return this.props.visible ? (
			<Tooltip title={this.props.tooltipTitle} placement={this.props.tooltipPlacement}>
				{this.props.wrapperClassName || this.props.wrapperStyle ? (
					<span style={this.props.wrapperStyle} className={this.props.wrapperClassName}>
						<Button
							{...buttonProps}
							id={this.props.id}
							className={this.props.className}
							name={this.props.name}
							style={this.props.style}
							shape={this.props.shape}
							size={this.props.size}
							onClick={this.props.onClick}
							type={this.props.type}
							disabled={this.props.disabled}
							loading={this.props.loading}
						>
							{this.props.icon ? (
								this.props.iconAnimation ? (
									<Icon
										name={this.props.icon}
										style={this.props.iconStyle}
										className={this.props.iconClassName}
										animation={this.props.iconAnimation}
										type={this.props.iconType}
									/>
								) : (
									<Icon
										name={this.props.icon}
										style={this.props.iconStyle}
										className={this.props.iconClassName}
										type={this.props.iconType}
									/>
								)
							) : null}
							{!this.props.icon && this.props.name}
							{this.props.children}
						</Button>
					</span>
				) : (
					<Button
						{...buttonProps}
						id={this.props.id}
						className={this.props.className}
						name={this.props.name}
						style={this.props.style}
						shape={this.props.shape}
						size={this.props.size}
						onClick={this.props.onClick}
						type={this.props.type}
						disabled={this.props.disabled}
						loading={this.props.loading}
					>
						{this.props.icon ? (
							this.props.iconAnimation ? (
								<Icon
									name={this.props.icon}
									style={this.props.iconStyle}
									className={this.props.iconClassName}
									animation={this.props.iconAnimation}
									type={this.props.iconType}
								/>
							) : (
								<Icon
									name={this.props.icon}
									style={this.props.iconStyle}
									className={this.props.iconClassName}
									type={this.props.iconType}
								/>
							)
						) : null}
						{!this.props.icon && this.props.name}
						{this.props.children}
					</Button>
				)}
			</Tooltip>
		) : null;
	}
}

export default CommonButton;
