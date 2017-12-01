const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

/* Props
Recommended
- onClick() (function triggered on button press)
- children (string for text in button)
Optional
- icon (string specifying icon in button)
- iconPosition ('left', 'right', or excluded for default)
- 
*/
class FlatButton extends React.Component {
  render() {
    const props = this.props;

    let textContent = [h('span', props.children)];
    let contents = textContent;

    if (props.icon) {
      contents.splice(props.iconPosition === 'right' ? 1 : 0, 0,
        h('i', {
          className: classNames('material-icons', { 'common-flat-button-right-icon': props.iconPosition === 'right' })
        }, props.icon)
      );
    }

    return h('div.common-flat-button', {
      onClick: () => props.onClick()
    }, contents);
  }
}

module.exports = FlatButton;
