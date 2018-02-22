const React = require('react');
const h = require('react-hyperscript');
const FlatButton = require('../../../flat-button');

class InteractionsSettingsMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      savedCatagories: new Map ()
    };
    this.handelClick.bind(this);
  }

  handelClick (e) {
    const saved = this.state.savedCatagories;
    if(!saved.has(e.target.textContent)){
      const edges= this.props.cy.edges().filter(`.${e.target.textContent}`);
      this.props.cy.remove(edges);
      const nodes = this.props.cy.nodes().filter(node=> node.connectedEdges().length<=0);
      const toSave = edges.union(nodes);
      this.props.cy.remove(nodes);
      if(toSave.length){
          saved.set(e.target.textContent, toSave);
      }
    }
    else{ 
      saved.get(e.target.textContent).restore();
      saved.delete(e.target.textContent);
    }
    this.setState({
      savedCatagories: saved
    });
  }

  render(){
    const buttons= ['Binding','Phosphorylation','Expression'
    ].map(but=>h(FlatButton,{children:but, onClick: (e) => this.handelClick(e),key:but}));
    return h('div',[buttons]);
    }
  

}
module.exports = InteractionsSettingsMenu;