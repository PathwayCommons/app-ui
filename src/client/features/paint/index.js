const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');

const PathwayCommonsService = require('../../services/').PathwayCommonsService;

class Paint extends React.Component {
  constructor(props) {
    super(props);
    const query = queryString.parse(props.location.search);

    this.state = {
      query: query,
      cy: {},
      sbgnText: {},
      name: '',
      datasource: ''
    };

    PathwayCommonsService.query(query.uri, 'SBGN')
      .then(text => {
        this.setState({
          sbgnText: text
        });
      });

    PathwayCommonsService.query(query.uri, 'json', 'Named/displayName')
      .then(response => {
        this.setState({
          name: response ? response.traverseEntry[0].value.pop() : ''
        });
      });

    PathwayCommonsService.query(query.uri, 'json', 'Entity/dataSource/displayName')
      .then(responseObj => {
        this.setState({
          datasource: responseObj ? responseObj.traverseEntry[0].value.pop() : ''
        });
      });
  }

  render() {
    return h('div.paint', [
      h('div.paint-menu'),
      h('div.paint-graph')
    ]);
  }
}

module.exports = Paint;