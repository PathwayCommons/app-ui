const React = require('react');
const PathwayCommonsService = require('../../../../../services/').PathwayCommonsService;

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
      <div className='graphInfoMenu'>
        <h1>{this.props.name}</h1>
        <h4>{'Source: '+this.props.datasource}</h4>
        <h2>Additional Information</h2>
        {this.state.comments.length ?
          this.state.comments.map((comment, index) => {
            return (
              <div key={index}>
                {comment.replace(/<p>/g, ' ')}
                <br/><br/>
              </div>
            );
          })
          :
          'No additional information provided by datasource.'
        }
      </div>
    );
  }
}

module.exports = GraphInfoMenu;