const React = require('react');

// could stand to be made a global 'snackbar' class at some point
class EditWarning extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.active) {
      this.setState({
        active: nextProps.active
      });
      setTimeout(() => {
        this.props.deactivate();
      }, this.props.dur);
    } else {
      this.setState({active: nextProps.active});
    }
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
      <div className={
        'flexCenter noSelect editWarning'
        +(this.state.active ? '' : ' closed')
        
      }>
        {this.props.children}
      </div>
    );
  }
}

module.exports = EditWarning;