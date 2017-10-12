const React = require('react');

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

  render() {
    const layoutItems = this.props.layouts.map((layout, index) => {
      return (
        <option key={index} value={layout}>{layout}</option>
      );
    });

    const nameText = (
      this.props.name ?
      this.props.name : this.props.nameFallback
    );

    const datasourceText = (
      this.props.datasource ? 
      this.props.datasource : this.props.datasourceFallback
    );

    return (
      <div className='menuBar flexCenter'>
        <div className='titleContainer'>
          <h4>{nameText+' | '+datasourceText}</h4>
        </div>
        <div
          className='layoutDropdownButton flexCenter noSelect'
          onClick={() => this.setState({dropdownOpen: !this.state.dropdownOpen})}
        >
          <i className='material-icons'>timeline</i>
        </div>
        <div className={'layoutDropdown flexCenter'+(this.state.dropdownOpen ? ' open' : '')}>
          <span>Layout</span>
          <select value={this.props.currLayout} onChange={(e) => this.props.updateLayout(e.target.value)}>
            {layoutItems}
          </select>
        </div>
      </div>
    );
  }
}

module.exports = Menu;