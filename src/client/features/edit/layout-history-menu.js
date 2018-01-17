
// OLD BUGGY CODE THAT IS GOOD FOR REFERENCE AFTER

// const React = require('react');
// const h = require('react-hyperscript');
// const Loader = require('react-loader');

// const { getLayoutConfig } = require('../../common/cy/layout/');

// const { ServerAPI } = require('../../services/');


// const ImageCard = props => {
//   return (
//     h('div.image-card', {onClick : props.onClick}, [
//       h('img', {
//         'src': props.src,
//         'alt': 'Image not found',
//       }),
//       h('span', props.children)
//     ])
//   );
// };

// class HistoryMenu extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       layouts: this.props.cy.scratch('_layoutRevisions'),
//       loading: true,
//       images: this.props.cy.scratch('_layoutImages')
//     };
//   }

//   componentDidMount() {
//     // if (!this.state.images || !this.state.layouts) {
//       ServerAPI.getLatestLayouts(this.props.networkMetadata.uri, 'latest', 10).then(res => {
//         this.setState({ layouts: res });

//         this.props.cy.scratch('_layoutRevisions', res);
//       })
//       .then(() => {
//         //Obtain an image of each layout
//         const graph = this.state.layouts.graph;
//         const layouts = this.state.layouts.layout;

//         const g = graph.nodes.concat(graph.edges).map(item => ({
//           data : {
//             id : item.data.id,
//             bbox : item.data.bbox,
//             parent : item.data.parent,
//             class : item.data.class,
//             portSource : item.data.portSource,
//             portTarget : item.data.portTarget,
//             source : item.data.source,
//             target : item.data.target
//           }
//         }));

//         ServerAPI.renderImages(g, layouts).then(res => {
//           this.setState({
//             images: res,
//             loading: false
//           });

//           // cache images
//           this.props.cy.scratch('_layoutImages', res);
//         });
//       });
//     // }
//   }

//   shouldComponentUpdate(nextProps, nextState) {
//     return !nextState.loading;
//   }


//   //TODO rewrite this
//   //Apply a previous layout to the cytoscape graph
//   //Requires a valid layout id
//   applyLayout(id, cy, props) {
//     //Obtain Layouts and positions
//     const layouts = this.state.layouts.layout;
//     const layout = layouts.filter(item => item.id === id)[0];
//     const positions = layout.positions;
//     const layoutConfig = getLayoutConfig(positions);

//     const layoutOpts = layoutConfig.defaultLayout.options;

//     cy.layout(layoutOpts).run();
//   }

//   //Generate a image card for a given layout
//   //Requires a valid layout and images object
//   renderImage(layout, images, cy) {
//     //Obtain layout information

//     const props = this.props;

//     let id = layout.id;
//     let imageList = images.filter(image => image.id === id);
//     let image = imageList.length > 0 ? imageList[0] : {};

//     //Parse Date
//     let date = new Date(image.date);
//     let dateStr = date.toString();

//     //Render image card with required information
//     return h(ImageCard, {
//       key: image.id,
//       src: image.img,
//       children: 'Date Added : ' + dateStr,
//       onClick: () => this.applyLayout(layout.id, cy, props)
//     });
//   }

//   render() {
//     //Get layout information 
//     let layouts = this.state.layouts;
//     let images = this.state.images;

//     //Display layouts list
//     if (layouts && images) {

//       if (layouts.length === 0 || images.length === 0) { return h('h2', 'No Layout Revisions'); }
  
//       layouts = layouts.layout;
      
//       return h('div', [
//         h('h2', 'Layout Revisions'),
//         layouts.map(layout => this.renderImage(layout, images, this.props.cy), this)
//       ]);
//     }

//     //Content is loading
//     return h('div', [
//       h('h2', 'Fetching Layout Revisions'),
//       h(Loader, { loaded: false, scale: 0.6 })
//     ]);

//   }
// }

// module.exports = HistoryMenu;