import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Icon extends Component {
    static propTypes = {
        name: PropTypes.string,
        color: PropTypes.string,
        style: PropTypes.object,
        className: PropTypes.string,
        size: PropTypes.number,
        innerIcon: PropTypes.string,
        innerColor: PropTypes.string,
        innerClassName: PropTypes.string,
        innerSize: PropTypes.number,
        prefix: PropTypes.string,
        onClick: PropTypes.func,
        type: PropTypes.oneOf(['fas', 'material'])
    };

    static defaultProps = {
        name: null,
        color: '',
        className: '',
        size: 1,
        innerIcon: null,
        innerColor: '',
        innerClassName: '',
        innerSize: 1,
        prefix: 'fas',
        type: 'fas',
    };

    getIconHtml = (prefix, name, className, size, color, type = 'fas') => {
        const style = Object.assign({}, this.props.style, {
            fontSize: `${size}em`,
            color,
        });
    
        if (type === 'material') {
            const materialClass = className || 'material-icons';
            return <span className={materialClass} style={style} onClick={this.props.onClick}>{name}</span>;
        } else {
            const iconClassName = `${prefix} fa-${name} ${className}`;
            return <i className={iconClassName} style={style} onClick={this.props.onClick} />;
        }
    };

    render() {
        const { color, size, className, innerIcon, innerColor, innerSize, innerClassName, prefix, type } = this.props;
        let { name } = this.props;
        if (name.startsWith('icon-')) {
            name = name.substr('icon-'.length);
        }
        const iconHtml = this.getIconHtml(prefix, name, className, size, color, type);
        let innerIconHtml = null;
        if (innerIcon) {
            innerIconHtml = this.getIconHtml(innerIcon, innerClassName, innerSize, innerColor, type);
        } else {
            return iconHtml;
        }
        return (
            <span className="fa-stack">
                {iconHtml}
                {innerIconHtml}
            </span>
        );
    }
}

export default Icon;
