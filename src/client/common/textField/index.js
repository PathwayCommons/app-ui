const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const CopyToClipboard = require('react-copy-to-clipboard');
const IconButton = require('../iconButton');

/* Props
Required
- text
Optional
- copy (set to true to add a copy to clipboard button)
- copyIcon (icon for copy button)
- copyDesc (description for copy button)
- copyCallback (function called when copy button is pressed)
*/
class TextField extends React.Component {
  render() {
    const props = this.props;

    const copyIcon = props.copyIcon || 'content_paste';
    const copyDesc = props.copyDesc || 'Copy to clipboard';

    return h('div.common-text-field-container', [
      h('input.common-text-field', { type: 'text', value: props.text, readOnly: true }),
      ...(props.copy ? [h('div.common-text-field-copy-container',
        [h(CopyToClipboard, { text: props.text, onCopy: () => {if (props.copyCallback) props.copyCallback(); } },
          h(IconButton, {
            icon: copyIcon,
            desc: copyDesc,
            size: 'small'
          }))]
        )] : [])
    ]);
  }
}

module.exports = TextField;