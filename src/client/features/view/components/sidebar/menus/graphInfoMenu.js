const React = require('react');
const PathwayCommonsService = require('../../../../../services/').PathwayCommonsService;

class GraphInfoMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      comments: []
    };
    PathwayCommonsService.query(props.uri, 'json', 'Entity/comment')
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
        {this.state.comments.length ?
          <h2>Additional Information</h2>+
          this.state.comments.map((comment, index) => {
            return (
              <div key={index}>
                {comment.replace(/<p>/g, ' ')}
                <br/><br/>
              </div>
            );
          })
          :
          ''
        }
      </div>
    );
  }
}

module.exports = GraphInfoMenu;