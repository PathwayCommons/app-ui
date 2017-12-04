const React = require('react');
const h = require('react-hyperscript');

class ImageCard extends React.Component {
  render(){
    return(
      h('div.image-card', {onClick : this.props.onClick}, [
        h('img', {
          'src': this.props.src,
          'alt': 'Image not found',
        }),
        h('span', this.props.children)
      ])
    );
  }
}

module.exports = ImageCard;