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
        <h1>Graph Information</h1>
        {this.state.comments.length ?
          this.state.comments.map((comment, index) => {
            return (
              <div key={index}>
                {comment.replace(/<p>/g, ' ')}
                <br/>
                <br/>
              </div>
            );
          })
          : 'No graph information found.'
        }
      </div>
    );
  }
}

module.exports = GraphInfoMenu;