import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Tag } from 'antd';

const AccessibleCheckableTag = forwardRef(({ checked, children, className, label, onChange }, _ref) => {
	const isChecked = !!checked;
	const handleKeyDown = event => {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return;
		}
		event.preventDefault();
		onChange(!isChecked);
	};

	return (
		<Tag.CheckableTag
			aria-checked={isChecked}
			aria-label={label}
			checked={isChecked}
			className={`rde-action-tag ${className || ''}`.trim()}
			onChange={onChange}
			onKeyDown={handleKeyDown}
			role="checkbox"
			tabIndex={0}
			title={label}
		>
			{children}
		</Tag.CheckableTag>
	);
});

AccessibleCheckableTag.displayName = 'AccessibleCheckableTag';

AccessibleCheckableTag.propTypes = {
	checked: PropTypes.bool,
	children: PropTypes.node,
	className: PropTypes.string,
	label: PropTypes.string.isRequired,
	onChange: PropTypes.func,
};

AccessibleCheckableTag.defaultProps = {
	children: null,
	className: '',
	onChange: () => {},
};

export default AccessibleCheckableTag;
