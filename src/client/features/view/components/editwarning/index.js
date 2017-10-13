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

  componentWillUpdate() {
    document.getElementsByClassName('editWarning')[0].style.display = (this.props.active ? 'flex' : 'none');
  }

  // Dynamically set "left" to centre div on screen after mounting
  componentDidMount() {
    const warningDOM = document.getElementsByClassName('editWarning')[0];
    
    // Set centering style for warning
    const curr_width = warningDOM.offsetWidth;
    const page_width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    warningDOM.style.left = (page_width - curr_width)/2+'px';

    // Set animation iteration dynamically based off duration and animation duration
    const anim_length = window.getComputedStyle(warningDOM).getPropertyValue('animation-duration');
    const inms = anim_length.indexOf('ms');
    var milliseconds = anim_length.slice(0, (inms === -1 ? -1 : -2)) * (inms === -1 ? 1000 : 1);
    warningDOM.style.animationIterationCount = Math.ceil(this.props.dur / milliseconds).toString();
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