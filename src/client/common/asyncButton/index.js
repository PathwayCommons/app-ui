const React = require('react');
const h = require('react-hyperscript');
const Loader = require('react-loader');

/* Props
Required
- onClick(header)
- header
Optional
- children
- loading
- loaderScale
- loaderWidth
*/
class AsyncButton extends React.Component {
  render() {
    const props = this.props;

    return (
      h('div.common-async-button', {
        onClick: () => props.onClick(this.props.header)
      }, [
          h('div.common-async-button-header', [
            h('h3', props.header),
            h('div.common-async-button-loader-container', [
              h(Loader, {
                loaded: !props.loading,
                options: {
                  scale: props.loaderScale || 0.5,
                  width: props.loaderWidth || 3
                }
              })
            ])
          ]),
          h('div.common-async-button-description', props.children)
        ])
    );
  }
}

module.exports = AsyncButton;