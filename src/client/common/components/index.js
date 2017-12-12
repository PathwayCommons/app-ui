const h = require('react-hyperscript');

const AsyncButton = require('./async-button');
const Dropdown = require('./dropdown');
const FlatButton = require('./flat-button');
const IconButton = require('./icon-button');
const Popover = require('./popover');
const Popup = require('./popup');
const TextTooltip = require('./text-tooltip');


const Icon = props => h('i.material-icons', props.icon);

module.exports = {
  AsyncButton,
  Dropdown,
  FlatButton,
  Icon,
  IconButton,
  Popover,
  Popup,
  TextTooltip
};