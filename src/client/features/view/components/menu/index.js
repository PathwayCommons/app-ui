const React = require('react');
const tippy = require('tippy.js');

/*
Props
- name
- uri
- datasource
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
    tippy('.layoutDropdownButton', {
      delay: [800, 400],
      animation: 'scale',
      theme: 'dark',
      arrow: true
    });
  }

  render() {
    const layoutItems = this.props.layouts.map((layout, index) => {
      return (
        <option key={index} value={layout}>{layout}</option>
      );
    });

    return (
      <div className='menuBar flexCenter'>
        <div className='pcLogoContainer flexCenter'>
          <img src='/img/icon.png'></img>
        </div>
        <div className='titleContainer'>
          <h4>{this.props.name+' | '+this.props.datasource}</h4>
        </div>
        <div
          className='layoutDropdownButton flexCenter noSelect'
          onClick={() => this.setState({dropdownOpen: !this.state.dropdownOpen})}
          title='Additional layout options'
        >
          <i className='material-icons'>timeline</i>
        </div>
        <div className={'layoutDropdown flexCenter'+(this.state.dropdownOpen ? ' open' : '')}>
          <select value={this.props.currLayout} onChange={(e) => this.props.updateLayout(e.target.value)}>
            {layoutItems}
          </select>
        </div>
      </div>
    );
  }
}

module.exports = Menu;