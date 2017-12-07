const React = require('react');
const h = require('react-hyperscript');
const Loader = require('react-loader');

const { getLayouts } = require('../../../../../common/cy/layout/');
const apiCaller = require('../../../../../services/apiCaller');
const revisions = require('../../../../../common/cy/revisions/');
const imageCard = require('./components/imageCard');

class HistoryMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      layouts: this.props.cy.scratch('_layoutRevisions'),
      loading: true,
      images: this.props.cy.scratch('_layoutImages')
    };
  }

  //Get layouts and images if they do not already exists
  componentDidMount() {
    if (!this.state.images || !this.state.layouts) {
      //Fetch most recent layout revisions from the server
      apiCaller.getLatestLayouts(this.props.uri, 'latest', 10).then(res => {
        this.setState({ layouts: res });

        //Store the revisions for future use
        this.props.cy.scratch('_layoutRevisions', res);
      })
        //Obtain an image of each layout
        .then(() => {
          let graph = this.state.layouts.graph;
          let layouts = this.state.layouts.layout;
          
          revisions.generateImages(layouts, graph).then(res => {
            this.setState({
              images: res,
              loading: false
            });

            //Store the images for future use
            this.props.cy.scratch('_layoutImages', res);
          });
        });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !nextState.loading;
  }

  //Apply a previous layout to the cytoscape graph
  //Requires a valid layout id
  applyLayout(id, cy, props) {
    //Obtain Layouts and positions
    const layouts = this.state.layouts.layout;
    const layout = layouts.filter(item => item.id === id)[0];
    const positions = layout.positions;
    const layoutConf = getLayouts(positions);

    //Update information within other components
    this.props.changeLayout(layoutConf);

    //Adjust the graph to match the new new layout
    revisions.rearrangeGraph(positions, cy, props);
  }

  //Generate a image card for a given layout
  //Requires a valid layout and images object
  renderImage(layout, images, cy) {
    //Obtain layout information
    let id = layout.id;
    let that = this;
    let imageList = images.filter(image => image.id === id);
    let image = imageList.length > 0 ? imageList[0] : {};

    //Parse Date
    let date = new Date(image.date);
    let dateStr = date.toString();

    //Render image card with required information
    return h(imageCard, {
      key: image.id,
      src: image.img,
      children: 'Date Added : ' + dateStr,
      onClick: () => that.applyLayout(layout.id, cy, that.props)
    });
  }

  render() {
    //Get layout information 
    let layouts = this.state.layouts;
    let images = this.state.images;

    //Display layouts list
    if (layouts && images) {

      if (layouts.length === 0 || images.length === 0) { return h('h2', 'No Layout Revisions'); }
  
      layouts = layouts.layout;
      
      return h('div', [
        h('h2', 'Layout Revisions'),
        layouts.map(layout => this.renderImage(layout, images, this.props.cy), this)
      ]);
    }

    //Content is loading
    return h('div', [
      h('h2', 'Fetching Layout Revisions'),
      h(Loader, { loaded: false, scale: 0.6 })
    ]);

  }
}

module.exports = HistoryMenu;