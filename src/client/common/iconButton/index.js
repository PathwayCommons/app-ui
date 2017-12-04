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
*/
class IconButton extends React.Component {
  render() {
    const props = this.props;

    let innerContent = h('div', {
      className: classNames('common-icon-button', { 'common-icon-button-active': props.active }),
      onClick: () => props.onClick()
    }, [h('i.material-icons', props.icon || 'info')]);

    const content = props.desc ? h(TextTooltip, { description: props.desc }, innerContent) : innerContent;

    return content;
  }
}

module.exports = IconButton;