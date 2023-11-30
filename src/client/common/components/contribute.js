const React = require('react');
const h = require('react-hyperscript');
const Popover = require('./popover');
// const classNames = require('classnames');

const { FACTOID_URL } = require('../../../config');

class Contribute extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    const { message, info } = this.props;

    return h('div.contribute', {}, [
      h('a.plain-link.contribute-popover-link', {
        href: `${FACTOID_URL}document/new`,
        target: '_blank'
      }, message),
      h(Popover , {
          tippy: {
            position: 'bottom',
            html: h('div.contribute-popover', [info] )
          }
        }, [
          h('i.material-icons', 'info')
        ]
      )
    ]);
  }
}

// Specifies the default values for props:
Contribute.defaultProps = {
  message: 'Add my data',
  info: h('div.contribute-popover-info', {
  }, [
    `Authors of primary research articles with pathway and interaction information (e.g. binding, transcription) can contribute these findings to Pathway Commons through Biofactoid. Learn more at `,
    h('a.plain-link', {
      href: `${FACTOID_URL}`,
      target: '_blank'
    }, 'biofactoid.org.')
  ])
};

module.exports = { Contribute };