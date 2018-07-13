const h = require('react-hyperscript');

const Dropdown = require('./dropdown');
const Popover = require('./popover');
const Popup = require('./popup');
const Tooltip = require('./tooltip');

const BaseNetworkView = require('./base-network-view');


const Icon = props => h('i.material-icons', props.icon);

module.exports = {
  BaseNetworkView,
  Dropdown,
  Icon,
  Popover,
  Popup,
  Tooltip
};