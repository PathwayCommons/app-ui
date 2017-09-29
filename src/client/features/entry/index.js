const React = require('react');
const h = require('react-hyperscript');

const SearchBar = require('../../common/components').SearchBar;

class Entry extends React.Component {
  render() {
    return h('div.entry', [
      h('div.entry-header', [
        h('a.entry-pc-link', {
          href: 'http://www.pathwaycommons.org'
        }, [
          h('img.entry-logo')
        ]),
        h('div.entry-title', [
          h('h2.entry-pc-title', 'athway Commons'),
          h('h5.entry-pc-description', 'Search pathways from public databases')
        ])
      ]),
      h(SearchBar, {
        placeholder: 'Enter pathway name or gene names',
        className: 'entry-searchbar',
        icon: 'search', query: {}
      })
    ]);
  }
}

module.exports = Entry;