const React = require('react');
const tippy = require('tippy.js');

/* Props
- name
- datasource
- layouts
- updateLayout
- currLayout
*/
class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdownOpen: false
    };
  }

  componentDidMount() {
    this.initTooltips();
  }

  initTooltips() {
    tippy('.layout-dropdown-button', {
      delay: [800, 400],
      animation: 'scale',
      theme: 'dark',
      arrow: true,
      touchHold: true
    });
  }

  render() {
    const layoutItems = this.props.layouts.map((layout, index) => {
      return (
        <option key={index} value={layout}>{layout}</option>
      );
    });

    return (
      <div className='menu-bar'>
        <div className='menu-bar-inner-container'>
          <div className='pc-logo-container'>
            <img src='/img/icon.png'></img>
          </div>
          <div className='title-container'>
            <h4>{this.props.name+' | '+this.props.datasource}</h4>
          </div>
          <div
            className='layout-dropdown-button'
            onClick={() => this.setState({dropdownOpen: !this.state.dropdownOpen})}
            title='Additional layout options'
          >
            <i className='material-icons'>timeline</i>
          </div>
        </div>
        <div className={'layout-dropdown '+(this.state.dropdownOpen ? ' open' : '')}>
          <select value={this.props.currLayout} onChange={(e) => this.props.updateLayout(e.target.value)}>
            {layoutItems}
          </select>
        </div>
      </div>
    );
  }
}

module.exports = Menu;