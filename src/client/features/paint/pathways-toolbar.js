
const React = require('react');
const h = require('react-hyperscript');

const IconButton = require('../../common/components/icon-button');


const { fit, expandCollapse, layout } = require('./cy');

class PathwaysToolbar extends React.Component {
  render(){
    let { cySrv, controller, activeMenu } = this.props;
    let cy = cySrv.get();

    return h('div.pathways-toolbar', [
      h(IconButton, { 
        description: 'Extra Information',
        onClick: () => controller.changeMenu('infoMenu'),
        isActive: activeMenu === 'infoMenu',
        icon: 'info'
      }),
      h(IconButton, { 
        description: 'Downloads',
        onClick: () => controller.changeMenu('downloadMenu'),
        isActive: activeMenu === 'downloadMenu',
        icon: 'file_download'
      }),
      h(IconButton, { 
        description: 'Downloads',
        onClick: () => controller.changeMenu('paintMenu'),
        isActive: activeMenu === 'paintMenu',
        icon: 'format_paint'
      }),
      h(IconButton, { 
        description: 'Expand/Collapse all complex nodes',
        onClick: () => expandCollapse( cy ),
        isActive: false,
        icon: 'select_all'
      }),
      h(IconButton, { 
        description: 'Fit pathway to screen',
        onClick: () => fit( cy ),
        isActive: false,
        icon: 'fullscreen'
      }),
      h(IconButton, { 
        description: 'Reset pathway arrangement',
        onClick: () => layout( cy ),
        isActive: false,
        icon: 'replay'
      }),
    ]);
  }
}

module.exports = PathwaysToolbar;