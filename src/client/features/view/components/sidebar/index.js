const React = require('react');

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      activeMenu: ''
    };
    this.updateIfOutOfMenu = this.updateIfOutOfMenu.bind(this);
  }

  handleIconClick(button) {
    if (!this.state.open) {this.toggleCloseListener(true);}
    this.setState({
      open: true,
      activeMenu: button
    });
  }

  toggleCloseListener(open) {
    if (open) {window.addEventListener('mousedown', this.updateIfOutOfMenu);}
    else {window.removeEventListener('mousedown', this.updateIfOutOfMenu);}
  }

  updateIfOutOfMenu(evt) {
    console.log('click detected.');
    var currentEl = evt.target;
    var loops = 0;
    while (currentEl.className !== 'View') {
      var currClassNames = currentEl.className.split(' ');
      if (
        currClassNames.includes('sidebarMenu') ||
        currClassNames.includes('toolButton')
      ) {
        return;
      }
      currentEl = currentEl.parentElement;

      // Catching infinite loops for safety. We should never have this run more than 100 times
      loops++;
      if (loops > 100) {return;}
    }
    this.setState({open: false});
  }

  render() {
    const menus = {
      'help': (
        <div className='helpMenu'>
          <h1>Help</h1>
          <h2>Features</h2>
          <h4>Layouts</h4>
          We support the following computer-generated layouts.
          <ul>
            <li>
              <a href="http://marvl.infotech.monash.edu/webcola/" target="_blank">force-directed (cola)</a> - The Cola.js physics simulation layout for Cytoscape.js
            </li>
            <li>
              <a href="http://www.sciencedirect.com/science/article/pii/S0020025508004799" target="_blank">force-directed (Cose-Bilkent)</a> - A force-directed layout algorithm for undirected compound graphs
            </li>
            <li>
              <a href="https://github.com/cytoscape/cytoscape.js-dagre" target="_blank">tree / hierarchical (dagre)</a> - The Dagre layout for DAGs and trees for Cytoscape.js
            </li>
            <li>
              <a href="https://github.com/OpenKieler/klayjs" target="_blank">layered (klay)</a> - Layer-based layout for node-link diagrams
            </li>
            <li>
              stratified (force-directed / layered) - Vertical ordering of common cellular compartments
            </li>
          </ul>
          <h4>Expand and Collapse</h4>
          Initially, complexes - those entities composed of others - are collapsed to reduce complexity. Click the octogonal shape to show or hide contents.
          <h4>Nearest Neighbours</h4>
          Hovering over a node triggers a highlight of the nearest neighbouring nodes and associated edges. Use this to follow a path of interest.
          <h2>Symbols</h2>
          <h4>Systems Biology Graphic Notation (SBGN)</h4>
          The view represents biochemical and cellular processes with symbols that conform to the <a href="http://www.nature.com/nbt/journal/v27/n8/full/nbt.1558.html" target="_blank">Systems Biology Graphic Notation (SBGN) standard</a>. The SBGN standard is composed of three 'languages' which are levels of increasing granularity. The viewer implements the <a href="http://journal.imbio.de/article.php?aid=263" target="_blank">Process Description (PD) </a> visual language which aims to represent the progression or change of molecular entities from one form to another.
          <br />
          Adopting SBGN helps to satisfy several requirements for representing cellular processes
          <ul>
            <li>
              Leverage the richness of the underlying data representation (<a href="http://www.biopax.org/" target="_blank">Biological Pathway Exchange (BioPAX)</a>)
            </li>
            <li>
              Broad scope of biological concepts
            </li>
            <li>
               Consistency across data sources
            </li>
            <li>
               Rich semantics associated with different symbols
            </li>
            <li>
              Avoid ambiguity
            </li>
            <li>
              Avoid the need for tacit, pre-existing knowledge in order to understand the display
            </li>
          </ul>
          The SBGN PD language depicts how entities change between states and how those changes are influenced by other molecules. This is reminiscent of the manner in which  metabolic pathways are described. The PD language supports a superior level of detail and best suited to capture the richness of the underlying data. Nevertheless, this comes at a cost of increased complexity in that entities can appear multiple times. Moreover, the detail and unambiguous nature of PD means that there is a learning curve for users more familiar with cartoon-like figures that appear in publications. To this end, we provide a simple walkthrough for interpreting a signaling pathway rendered in SBGN-PD.
          
        </div>
      )
    };

    const toolButtonNames = ['panorama', 'file_download', 'help'];
    const tooltips = [
      'Download an png of this Pathway',
      'See other download options',
      'Field guide to interpreting the display'
    ];
    const toolButtons = toolButtonNames.map((button, index) => {
      var buttonClassName = button+'MenuButton';
      return (
        <div
          key={index}
          className='toolButton noSelect flexCenter'
          onClick={() => this.handleIconClick(button)}
          title={tooltips[index]}
        >
          <i className={'material-icons '+buttonClassName}>{button}</i>
        </div>
      );
    });

    return (
      <div className={'sidebarMenu'+(this.state.open ? ' open' : '')}>
        <div className='sidebarSelect'>
          {toolButtons}
        </div>
        <div className='sidebarContent'>
          {menus[this.state.activeMenu]}
        </div>
      </div>
    );
  }
}

module.exports = Sidebar;