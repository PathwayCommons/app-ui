const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

const IconButton = require('./icon-button');

/* Props
- active
- deactivate()
- duration
*/
class Popup extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      timeout: null
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.active) {
      let timeout = setTimeout(() => {
        this.props.deactivate();
      }, this.props.duration);
      this.setState({ timeout: timeout });
    }
  }

  shouldComponentUpdate(nextProps) {
    return this.props.active !== nextProps.active;
  }

  closePopup() {
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
      this.setState({ timeout: null });
    }
    this.props.deactivate();
  }

  render() {
    return (
      h('div', {
        className: classNames('common-popup-container', { 'common-popup-container-open': this.props.active }, 'common-popup-container-left'),
        ref: dom => this.warningDOM = dom
      }, [
        h('div.common-popup', [
          this.props.children,
          h(IconButton, {
            icon: 'close',
            onClick: () => this.closePopup(),
            desc: 'Dismiss'
          })
        ])
      ])
    );
  }
}

module.exports = Popup;