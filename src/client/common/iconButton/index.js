const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

const TextTooltip = require('../textTooltip');

/* Props
Required
- icon (string relating to a material icon, defaults to info)
- onClick()
Optional
- desc (string to display in tooltip or blank for no tooltip)
- active (false - default, or true)
- theme (specify 'light' to get a light button)
- size (specify 'small' to get a small button)
*/
class IconButton extends React.Component {
  render() {
    const props = this.props;

    const theme = props.theme === 'light' ? props.theme : 'dark';
    const size = props.size === 'small' ? props.size : 'regular';
    const icon = props.icon || 'info';

    let innerContent = h('div', {
      className: classNames(
        'common-icon-button',
        { 'common-icon-button-light': theme === 'light' },
        { 'common-icon-button-small': size === 'small' },
        { 'common-icon-button-active': props.active }
      ),
      onClick: () => props.onClick()
    }, [h('i.material-icons', icon)]);

    const content = props.desc ? h(TextTooltip, { description: props.desc }, innerContent) : innerContent;

    return content;
  }
}

module.exports = IconButton;