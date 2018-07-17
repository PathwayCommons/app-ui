
const React = require('react');
const h = require('react-hyperscript');

const Tooltip = require('../../common/components/tooltip');

const events = require('./pathways-events');

const { fit, expandCollapse, layout } = require('./pathways-cy');

class PathwaysButtons extends React.Component {
  render(){
    let { cySrv, bus } = this.props;
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
      ])
    ]);    
  }
}

module.exports = PathwaysButtons;