
const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

const Tooltip = require('../../common/components/tooltip');

const { fit, expandCollapse, layout, searchNodes } = require('./cy');

class PathwaysToolbar extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      searchValue: ''
    };
  }

  handleNodeSearchChange(searchVal){
    this.setState({ searchValue: searchVal }, () => searchNodes( this.props.cySrv.get(), searchVal));
  }

  render(){
    let { cySrv, controller, activeMenu } = this.props;
    let { searchValue } = this.state;
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
        h(Tooltip, { description: 'Downloads '}, [
          h('div.icon-button', {
            onClick: () => { controller.changeMenu('downloadMenu'); },
            className: classNames({'icon-button-active': activeMenu === 'downloadMenu' })
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
      h('div.pathways-search-nodes', {
        onChange: e => this.handleNodeSearchChange(e.target.value)
      }, [
        h('div.pathways-search-bar', [
          h('input.pathways-search-input', {
            value: searchValue,
            type: 'search',
            placeholder: 'Search entities',
          }),
          searchValue !== '' ? h('div.pathways-search-clear', {
            onClick: () => this.handleNodeSearchChange('')}, [
            h('i.material-icons', 'close')
          ]) : null
        ])
      ])
    ]);
  }
}

module.exports = PathwaysToolbar;