const React = require('react');

class ImageCard extends React.Component {
  render(){
    return(
      <div className='image-card'>
        <img src={this.props.src} alt='Image not found' />
        <span>{this.props.children}</span>
      </div>
    );
  }
}

module.exports = ImageCard;