const React = require('react');
const h = require('react-hyperscript');
const Loader = require('react-loader');

/* Props
- onClick(header)
- loading
- header
- children
*/
class AsyncButton extends React.Component {
  render() {
    return (
      h('div.download-option', {
        onClick: () => this.props.onClick(this.props.header)
      }, [
          h('div.download-option-header', [
            h('h3', this.props.header),
            h('div.download-loader-container', [
              h(Loader, {
                loaded: !this.props.loading,
                options: {
                  scale: 0.5,
                  width: 3
                }
              })
            ])
          ]),
          h('div.download-option-description', [
            this.props.children
          ])
        ])
    );
  }
}

module.exports = AsyncButton;