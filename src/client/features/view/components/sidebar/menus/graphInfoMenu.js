const React = require('react');
const h = require('react-hyperscript');

const datasourceLinks = require('../../../config').databases;

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
  
  getDatasourceLink(datasource) {
    let link = datasourceLinks.filter(value => datasource.toUpperCase().indexOf(value[0].toUpperCase()) !== -1);
    if (link.length === 1 && link[0][1]) {
      return link[0][1];
    }
    else {
      return '';
    }
  }

  render() {
    const datasourceLink = this.getDatasourceLink(this.props.datasource);

    const noInfoMessage = h('span', [
      'No additional information was found for this network!',
      h('br'),
      h('br'),
      'Additional information about the network is normally found here, but we couldn\'t find any for this one.'
    ]);

    return (
      h('div', [
        h('h1', this.props.name),
        h('h4', [
          'Sourced from '
        ].concat(
          datasourceLink.length > 0 ? 
          h('a', {
            href: this.getDatasourceLink(this.props.datasource),
            target: '_blank'
          }, this.props.datasource)
          :
          [this.props.datasource]
        ))
      ].concat(
        (this.state.comments.length ?
          [h('h2', 'Additional Information')].concat(
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
          )
          :
          [noInfoMessage]
        )
      ))
    );
  }
}

module.exports = GraphInfoMenu;