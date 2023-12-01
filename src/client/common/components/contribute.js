const React = require('react');
const h = require('react-hyperscript');
const Popover = require('./popover');

const { FACTOID_URL } = require('../../../config');

class Contribute extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    const { text, info } = this.props;

    return h('div.contribute', {}, [
      h('a.plain-link.contribute-popover-link', {
        href: `${FACTOID_URL}document/new`,
        target: '_blank'
      }, text),
      h(Popover , {
          tippy: {
            position: 'bottom',
            html: h('div.contribute-popover', [info] )
          }
        }, [ h('i.material-icons', 'info') ]
      )
    ]);
  }
}

// Specifies the default values for props:
Contribute.defaultProps = {
  text: 'Add my data',
  info: h('div.contribute-popover-info', {
  }, [
    `Authors of primary research articles with pathway and interaction information (e.g. binding, transcription) can contribute these findings to Pathway Commons through Biofactoid. Learn more at `,
    h('a.plain-link', {
      href: `${FACTOID_URL}`,
      target: '_blank'
    }, 'biofactoid.org'), '.'
  ]),
};

module.exports = { Contribute };