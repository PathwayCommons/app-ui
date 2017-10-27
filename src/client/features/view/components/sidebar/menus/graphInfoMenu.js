const React = require('react');
const h = require('react-hyperscript');

const PathwayCommonsService = require('../../../../../../service/').PathwayCommonsService;

class GraphInfoMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      comments: []
    };
  }

  componentWillMount() {
    PathwayCommonsService.query(this.props.uri, 'json', 'Entity/comment')
      .then(responses => {
        this.setState({
          comments: responses ? responses.traverseEntry[0].value : []
        });
      });
  }

  render() {
    return (
      h('div', [
        h('h1', this.props.name),
        h('h4', 'Source: '+this.props.datasource),
        h('h2', 'Additional Information'),
        (this.state.comments.length ?
          this.state.comments.map((comment, index) => {
            return (
              h('div', {
                'key': index
              }, [
                comment.replace(/<p>/g, ' '),
                h('br'),
                h('br')
              ])
            );
          })
          :
          'No additional information provided by datasource.'
        )
      ])
    );
  }
}

module.exports = GraphInfoMenu;