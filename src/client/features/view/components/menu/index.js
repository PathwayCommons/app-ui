const React = require('react');

/*
Props
- name
- uri
- datasource
- active_overlay
- cy
- changeOverlay
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
          <h1>{this.props.name}</h1>
        </div>
        <div className='toolbarContainer flexCenter'>
          <div className='toolButton noSelect'>
            <i className='material-icons'>panorama</i>
          </div>
          <div className='toolButton noSelect'>
            <i className='material-icons'>file_download</i>
          </div>
          <div className='toolButton noSelect'>
            <i className='material-icons'>help</i>
          </div>
          <div className='layoutDropdown'>
            <select value={this.props.currLayout} onChange={(e) => this.props.updateLayout(e.target.value)}>
              {layoutItems}
            </select>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = Menu;