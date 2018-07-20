const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const _ = require('lodash');

class Dropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      title: props.title
    };

    this.handleClose = e => this.close(e);
  }

  open( e ){
    e.preventDefault();

    this.setState({ open: true}, () => {
      document.addEventListener('click', this.handleClose);
    });
  }

  close( e ){
    if( !this.el.contains(e.target) ){
      this.setState({ open: false }, () => {
        document.removeEventListener('click', this.handleClose);
      });
    }
  }

  handleChange( newVal ){
    this.props.onChange(newVal);
    this.setState({ open: false, title: newVal.label }, () => {
      document.removeEventListener('click', this.handleClose);
    });
  }

  render() {
    const { listOptions } = this.props;
    const { open, title } = this.state;
  
    return (
      h(`div.dropdown`, { ref: el => this.el = el, className: classNames(this.props.className, {'dropdown-active': open}) }, [
        h('div.dropdown-header', { onClick: e => this.open(e) }, [
          h('div.dropdown-title', title),
          h('i.material-icons', open ? 'keyboard_arrow_up' : 'keyboard_arrow_down')
        ]),

        open ? h('div.dropdown-options', listOptions.map( dOpt => {
          return h('div.dropdown-option', [
            h('div', { key: dOpt.value, onClick: e => this.handleChange(dOpt) }, dOpt.label )
          ]);
        })) : null
      ])
    );
  }
}

module.exports = Dropdown;