const React = require('react');

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

  componentDidUpdate() {
    const warningDOM = this.warningDOM;
    
    // Set animation iteration dynamically based off duration and animation duration
    const anim_length = window.getComputedStyle(warningDOM).getPropertyValue('animation-duration');
    const inms = anim_length.indexOf('ms');
    let milliseconds = anim_length.slice(0, (inms === -1 ? -1 : -2)) * (inms === -1 ? 1000 : 1);
    warningDOM.style.animationIterationCount = Math.ceil(this.props.dur / milliseconds).toString();
  }

  render() {
    return (
      <div className={'edit-warning-container '+(this.props.active ? '' : ' closed')} ref={dom => this.warningDOM = dom}>
        <div className='edit-warning'>
          {this.props.children}
        </div>
      </div>
    );
  }
}

module.exports = EditWarning;