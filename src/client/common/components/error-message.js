const React = require('react');
const h = require('react-hyperscript');

class ErrorMessage extends React.Component {
  render(){
    const title = h('h1.error-message-title',
      this.props.title !== undefined ? this.props.title : 'An error occurred' );

    const body = this.props.body ?
      h('p.error-message-body', [
        h('span', this.props.body )
      ]) : null;

    const footer = h('p.error-message-footer', this.props.footer !== undefined ? this.props.footer: [
      h('span', 'If difficulties persist, please report this to our '),
      h('a.plain-link', { href: 'mailto: pathway-commons-help@googlegroups.com' }, 'help forum.')
    ]);

    return  h('div.error-message', [
      title,
      body,
      footer
    ]);
  }
}

module.exports = { ErrorMessage };