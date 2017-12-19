const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const CopyToClipboard = require('react-copy-to-clipboard');
const IconButton = require('../iconButton');

/* Props
- text
*/
class CopyField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      copied: false,
    };
  }

  render() {
    return (h('div.common-copy-field-container', [
      h('textarea.common-copy-field', {type : 'text',  value: this.props.text, onChange: () => this.setState({ copied: false }) }),
      h(CopyToClipboard, { text: this.props.text, onCopy: () => this.setState({ copied: true }) },
        h(IconButton, {
          icon: 'content_paste',
          desc: 'Copy to Clipboard'
        }))
    ]));
  }
}

module.exports = CopyField;