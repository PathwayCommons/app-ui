
const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classNames');

const Tooltip = require('../../common/components/tooltip');

const { fit, expandCollapse, layout } = require('./cy');

class PathwaysToolbar extends React.Component {
  render(){
    let { cySrv, controller, activeMenu } = this.props;
    let cy = cySrv.get();

    return h('div.pathways-toolbar', [
      h(Tooltip, { description: 'Extra Information' }, [
        h('div.icon-button', {
          onClick: () => { controller.changeMenu('infoMenu'); },
          className: classNames({'icon-button-active': activeMenu === 'infoMenu' })
        }, [
          h('i.material-icons', 'info')
        ])
      ]),
      h(Tooltip, { description: 'Downloads ' }, [
        h('div.icon-button', {
          onClick: () => { controller.changeMenu('downloadMenu'); },
          className: classNames({'icon-button-active': activeMenu === 'downloadMenu' })
        }, [
          h('i.material-icons', 'file_download')
        ])
      ]),
      h(Tooltip, { description: 'Expression data' }, [
        h('div.icon-button', {
          onClick: () => { controller.changeMenu('paintMenu'); },
          className: classNames({'icon-button-active': activeMenu === 'paintMenu' })
        }, [
          h('i.material-icons', 'format_paint')
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

module.exports = PathwaysToolbar;