const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;

class Error extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      h('div.error', [
        h('h1', 'The requested page can\'t be found'),
        h('hr'),
        h('p', 'If difficulties persist, please contact pathway-commons-help@googlegroups.com to report the problem.'),
        h(Link, {
            to: { pathname: '/' }
          }, [
            h('button.error-search-button', 'Back to Search')
        ])
      ])
    );
  }
}

module.exports = Error;
