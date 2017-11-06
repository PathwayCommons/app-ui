const React = require('react');
const h = require('react-hyperscript');
const ImageCard = require('./components/imageCard');

class HelpMenu extends React.Component {
  render() {
    return (
      h('div', [
        h('h1', 'Help'),
        h('h2', 'Features'),
        h('h4', 'Layouts'),
        'Some graphs have human-created layouts. We strongly recommend using the custom layout option if available for the clearest experience. We also support the following computer-generated layouts.',
        h('ul', [
          h('li', [
            h('a', {
              href: 'http://marvl.infotech.monash.edu/webcola/',
              target: '_blank'
            }, 'Force Directed 1'),
            ' - The CoSE-Bilkent force-directed layout algorithm for undirected compound graphs'
          ]),
          h('li', [
            h('a', {
              href: 'http://www.sciencedirect.com/science/article/pii/S0020025508004799',
              target: '_blank'
            }, 'Force Directed 2'),
            ' - The Cola.js physics simulation layout for Cytoscape.js'
          ]),
          h('li', [
            h('a', {
              href: 'https://github.com/cytoscape/cytoscape.js-dagre',
              target: '_blank'
            }, 'Tree'),
            ' - The Dagre layout for DAGs and trees for Cytoscape.js'
          ]),
          h('li', [
            h('a', {
              href: 'https://github.com/OpenKieler/klayjs',
              target: '_blank'
            }, 'Layered'),
            ' - The Klay Layer-based layout for node-link diagrams'
          ]),
          h('li', 'Stratified - Vertical ordering of common cellular compartments')
        ]),
        h('h4', 'Expand and Collapse'),
        'Initially, complexes - those entities composed of others - are collapsed to reduce complexity. Click the octogonal shape to show or hide contents.',
        h(ImageCard, {
          src: 'img/view/help/help_figure_collapse.png'
        }, [
          h('strong', 'Expanding and collapsing complexes.'),
          h('br'),
          'A complex of the Bone Morphogenic Protein 2 (BMP) with its cognate Type I and Type II receptors (BMPR).'
        ]),
        h('h4', 'Nearest Neighbours'),
        'Hovering over a node triggers a highlight of the nearest neighbouring nodes and associated edges. Use this to follow a path of interest.',
        h(ImageCard, {
          src: 'img/view/help/help_highlightNeighbour.png'
        }, [
          h('strong', 'Highlighting neighbouring nodes and edges.'),
          h('br'),
          'The trans-phosphorylation of BMP2 in complex with receptors (BMPRI/II). Hovering over the process node (square) higlights reaction participants and edges that are otherwise coloured light grey.'
        ]),
        h('h2', 'Symbols'),
        h('h4', 'Systems Biology Graphic Notation (SBGN)'),
        'The view represents biochemical and cellular processes with symbols that conform to the ',
        h('a', {
          href: 'http://www.nature.com/nbt/journal/v27/n8/full/nbt.1558.html',
          target: '_blank'
        }, 'Systems Biology Graphic Notation (SBGN) standard'),
        '. The SBGN standard is composed of three \'languages\' which are levels of increasing granularity. The viewer implements the ',
        h('a', {
          href: 'http://journal.imbio.de/article.php?aid=263',
          target: '_blank'
        }, [
          'Process Description (PD) visual language which aims to represent the progression or change of molecular entities from one form to another.',
          h('br'),
          'Adopting SBGN helps to satisfy several requirements for representing cellular processes',
        ]),
        h('ul', [
          h('li', [
            'Leverage the richness of the underlying data representation (',
            h('a', {
              href: 'http://www.biopax.org/',
              target: '_blank'
            }, 'Biological Pathway Exchange (BioPAX)'),
            ')'
          ]),
          h('li', 'Broad scope of biological concepts'),
          h('li', 'Consistency across data sources'),
          h('li', 'Rich semantics associated with different symbols'),
          h('li', 'Avoid ambiguity'),
          h('li', 'Avoid the need for tacit, pre-existing knowledge in order to understand the display')
        ]),
        'The SBGN PD language depicts how entities change between states and how those changes are influenced by other molecules. This is reminiscent of the manner in which  metabolic pathways are described. The PD language supports a superior level of detail and best suited to capture the richness of the underlying data. Nevertheless, this comes at a cost of increased complexity in that entities can appear multiple times. Moreover, the detail and unambiguous nature of PD means that there is a learning curve for users more familiar with cartoon-like figures that appear in publications. To this end, we provide a simple walkthrough for interpreting a signaling pathway rendered in SBGN-PD.',
        h('h4', 'Example walkthough'),
        'To illustrate the interpretation of an SBGN-PD view, we examine a portion of the ',
        h('a', {
          href: 'http://www.reactome.org/PathwayBrowser/#/R-HSA-201451',
          target: '_blank'
        }, '\'Signaling by BMP\''),
        ' pathway from ',
        h('a', {
          href: 'http://www.reactome.org/',
          target: '_blank'
        }, 'Reactome'),
        '. In particular, we focus our attention on a single \'reaction\' within the pathway that depicts ',
        h('a', {
          href: 'http://www.reactome.org/PathwayBrowser/#/R-HSA-201451&SEL=R-HSA-201443&PATH=R-HSA-162582',
          target: '_blank'
        }, 'trans-phosphorylation of the Type I receptor by the Type II receptor following binding of the BMP ligand'),
        '. The original view from the Reactome web site is shown below.',
        h(ImageCard, {
          src: 'img/view/help/help_walkthrough_reactome_sigBMP.png'
        }, [
          h('strong', 'Reactome view of \'Type II receptor phosphorylates type I receptor\'.'),
          h('br'),
          'Formation of the hetero-tetrameric BMP2:receptor complex induces receptor rotation, so that their cytoplasmic kinase domains face each other in a catalytically favourable configuration. The constitutively active type II receptor kinase (which auto-phosphorylates in the absence of ligand), trans-phosphorylates specific serine residues at the conserved Gly-Ser-rich juxtapositioned domain of the type I receptor. It is not known if exactly 8 ATPs are required for the phosphorylation of type I receptor, there could be more or less than this number.'
        ]),
        'The same pathway sourced from Pathway Commons and displayed in the SBGN-PD-compliant View is very similar to Reactome\'s rendering.',
        h(ImageCard, {
          src: 'img/view/help/help_walkthrough_search_sigBMP_expanded.png'
        }, [
          h('strong', 'View of Reactome\'s \'Signaling by BMP\' sourced from Pathway Commons.'),
          h('br'),
          'The octagonal shapes represent biological complexes - \'compound\' nodes - that contain other entities. The square node represents a biological conversion and is known as a \'process\' node. In this case, the unphosphorylated Type I receptor transitions to a phosphorylated state via trans-phosphorylation upon engagement of a BMP2 ligand. The arc terminating in a circle depicts a catalytic control of the conversion.'
        ]),
        'An important conceptual aspect of SBGN-PD is that physical entities do not act directly upon other physical entities; Rather, entities influence (\'control\') processes (\'conversions\') that describe those changes. Concretely, to describe the change in phosphorylation state of the BMP ligand-receptor (BMP:BMPR), the complex is shown to be both a participant and controller of a catalysis (arc terminating in a circle) that acts to promote a biochemical reaction (square) describing addition of ATP to the Type I receptor. The manner in which a ligand-receptor complex acts upon a phosphorylation reaction is in contrast the the more common depiction of this process whereby an unphosphorylated receptor simply adds phosphates to itself.',
        h('h4', 'Quick reference: SBGN-PD Glyphs'),
        'Right click the following image and select \'open in new tab\' to view a larger version.',
        h(ImageCard, {
          src: 'img/view/help/help_figure_sbgnpd.png'
        }, [
          h('strong', 'List of all glyphs specified by SBGN Process Diagram Level 1.'),
          h('br'),
          'Please refer to the ',
          h('a', {
            href: 'http://sbgn.github.io/sbgn/specifications',
            target: '_blank'
          }, 'SBGN-PD specification'),
          ' for a full description of the symbols and their meaning.'
        ])
      ])
    );
  }
}

module.exports = HelpMenu;