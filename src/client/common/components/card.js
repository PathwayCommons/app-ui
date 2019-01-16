const React = require('react');
const h = require('react-hyperscript');

class Card extends React.Component {
  render(){
    return h('div.card', [
      this.props.children
    ]);
  }
}

class CardGrid extends React.Component {
  render(){
    return h('div.card-grid', this.props.children.map( item => h(Card, [ item ] )));
  }
}

module.exports = { Card, CardGrid };