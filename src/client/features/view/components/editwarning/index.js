const React = require('react');

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

  // Dynamically set "left" to centre div on screen after mounting
  componentDidMount() {
    const warningDOM = document.getElementsByClassName('editWarning')[0];
    const curr_width = warningDOM.offsetWidth;
    const page_width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    warningDOM.style.left = (page_width - curr_width)/2+'px';
  }

  render() {
    return (
      <div className={'flexCenter noSelect editWarning'+(this.props.active ? '' : ' closed')}>
        {this.props.children}
      </div>
    );
  }
}

module.exports = EditWarning;