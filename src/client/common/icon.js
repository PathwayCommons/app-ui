const h = require('react-hyperscript');

module.exports = props => h('i.material-icons', props.icon);

// e.g. h(Icon, { icon: 'done' })