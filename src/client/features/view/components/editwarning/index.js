const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

/* Props
- active
- deactivate()
- dur
*/

// could stand to be made a global 'snackbar' class at some point
class EditWarning extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.active) {
      setTimeout(() => {
        this.props.deactivate();
      }, this.props.dur);
    }
  }

  shouldComponentUpdate(nextProps) {
    return this.props.active !== nextProps.active;
  }

  render() {
    return (
      h('div', {
        className: classNames('edit-warning-container', this.props.active ? '' : 'closed'),
        ref: dom => this.warningDOM = dom
      }, [
        h('div.edit-warning', this.props.children)
      ])
    );
  }
}

module.exports = EditWarning;