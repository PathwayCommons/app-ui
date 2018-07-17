
const React = require('react');
const h = require('react-hyperscript');

const Tooltip = require('../../common/components/tooltip');

const events = require('./pathways-events');

const { fit, expandCollapse, layout, searchNodes } = require('./pathways-cy');

class PathwaysToolbar extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      searchValue: ''
    };
  }

  handleNodeSearchChange(searchVal){
    console.log('here');
    this.setState({ searchValue: searchVal }, () => searchNodes( this.props.cySrv.get(), searchVal));
  }

  render(){
    let { cySrv, bus, controller } = this.props;
    let { searchValue } = this.state;
    let cy = cySrv.get();

    return h('div.pathways-buttons', [
      h(Tooltip, { description: 'Extra Information' }, [
        h('div.icon-button', {
          onClick: () => { bus.emit(events.SHOW_INFO); },
        }, [
          h('i.material-icons', 'info')
        ])
      ]),
      h(Tooltip, { description: 'Downloads' }, [
        h('div.icon-button', {
          onClick: () => { bus.emit(events.SHOW_DOWNLOADS); },
          // className: classNames({'icon-button-active': state.activeMenu === btn.menuId })
        }, [
          h('i.material-icons', 'file_download')
        ])
      ]),
      h(Tooltip, { description: 'Expand/Collapse all complex nodes' }, [
        h('div.icon-button', {
          onClick: () => { expandCollapse( cy ); }
        }, [
          h('i.material-icons', 'select_all')
        ])
      ]),
      h(Tooltip, { description: 'Fit pathway to screen' }, [
        h('div.icon-button', {
          onClick: () => { fit( cy ); }
        }, [
          h('i.material-icons', 'fullscreen')
        ])
      ]),
      h(Tooltip, { description: 'Reset pathway arrangement'}, [
        h('div.icon-button', {
          onClick: () => { layout( cy ); }
        }, [
          h('i.material-icons', 'replay')
        ])
      ]),
      h('div.search-nodes', {
        onChange: e => this.handleNodeSearchChange(e.target.value)
      }, [
        h('div.view-search-bar', [
          h('input.view-search', {
            value: this.state.searchVal,
            type: 'search',
            placeholder: 'Search entities',
          }),
          searchValue !== '' ? h('div.view-search-clear', {
            onClick: () => this.handleNodeSearchChange('')}, [ // check if the search bar is empty
            h('i.material-icons', 'close')
          ]) : null
        ])
      ])
    ]);    
  }
}

module.exports = PathwaysToolbar;