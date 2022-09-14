const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

class AppCard extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    let { enabled, hint, url, image, imageClass, title, body } = this.props;

    return h('.app-card', {
        className: classNames({ 'app-card-disabled': !enabled })
      }, [
      h( 'a', {
        href: url,
        target: '_blank'
      }, [
        h( 'div.app-card-image', {
          className: classNames({
            [imageClass]: !!imageClass,
            'background': !!imageClass,
          })
        }, [ image ]),
        h('div.app-card-content', [
          h( 'div.app-card-header', [
            h( 'h4.app-card-title', [title] ),
            h( 'span.app-card-hint', [hint] )
          ]),
          h( 'div.app-card-body', [body] )
        ])
      ])
    ]);
  }
}

// Specifies the default values for props:
AppCard.defaultProps = {
  enabled: true,
  hint: null,
  imageClass: null,
  image: null
};

module.exports = { AppCard };