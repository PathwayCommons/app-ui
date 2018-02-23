const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

class InteractionsSettingsMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      savedCatagories: new Map (),
      buttons:new Map([['Binding',false],
                      ['Phosphorylation',false],
                      ['Expression',false]
                    ]),
    };
    this.handelClick.bind(this); 
  }

  handelClick (e) {
    const state=this.state;
    const saved = state.savedCatagories;
    const buttons=state.buttons;
    const type= e.target.textContent;
    buttons.set(type,!buttons.get(type));
    if(!saved.has(type)){
      const edges= this.props.cy.edges().filter(`.${type}`);
      this.props.cy.remove(edges);
      const nodes = edges.connectedNodes();
         const toSave = edges.union(nodes);
      this.props.cy.remove(nodes.filter(nodes=>nodes.connectedEdges().length<=0));
      if(toSave.length){
          saved.set(type, toSave);
      }
    }
    else{ 
     saved.get(type).restore();
      saved.delete(type);
    }
    this.setState({
      savedCatagories: saved,
      buttons:buttons
    });
  }

  render(){
   const buttons= [...this.state.buttons].map(([type, clicked])=>
      h('div',{key:type,className:classNames ('interaction-settings-button',clicked? 'interaction-settings-clicked':'interaction-settings-not-clicked'),onClick: (e) => this.handelClick(e)},[
        h('div',{className:classNames(type,'interaction-settings-legend')}),
        h('h2.button-label',type),
      ]));
    return h('div',buttons);
    }
  
}
module.exports = InteractionsSettingsMenu;