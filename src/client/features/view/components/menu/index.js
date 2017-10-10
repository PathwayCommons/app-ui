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
  render() {
    const layoutItems = this.props.layouts.map((layout, index) => {
      return (
        <option key={index} value={layout}>{layout}</option>
      );
    });

    return (
      <div className='menuBar flexCenter'>
        <div className='titleContainer'>
          <h4>{this.props.name+' | '+this.props.datasource}</h4>
        </div>
        <div className='layoutDropdown flexCenter'>
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