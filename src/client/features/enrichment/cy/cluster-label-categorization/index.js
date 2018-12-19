const _ = require('lodash');


const { stemmer } = require('porter-stemmer');
const stopWords = require('./stopwords.json');
const flaggedWords = require('./flaggedwords.json');

let textCharacterization = (text) => {
  let delimiterRegex = /[\t \n\r\f!\\#$%&()*+,.<=>?@[^\\\]`_{|}~\\'"]/;
  let filterWords = new Set([...stopWords, flaggedWords]);
  let wordPairMap = new Map();
  let wordOccurenceMap = new Map();
  let stemToWordsMap = new Map();

  let incrKey = ( m, k ) => {
    if( m.has( k ) ){
      m.set(k, m.get(k) + 1);
    } else {
      m.set( k, 1 );
    }
  };
  let appendKey = ( m, k, v ) => {
    if( m.has( k ) ){
      m.set(k, m.get(k).add(v) );
    } else {
      m.set( k, new Set([v]) );
    }
  };

  let wordStems = _.uniq(text.split(delimiterRegex).filter( word => !filterWords.has(word) && word !== '' ).map( word => word.toLowerCase() ).map( word => {
    incrKey( wordOccurenceMap, word );
    let wordStem = stemmer(word);
    appendKey( stemToWordsMap, wordStem, word );
    return wordStem;
   } ) );


  for( let i = 0; i < wordStems.length - 1; i++ ){
    for( let j = 1; j < wordStems.length -1; j++ ){
      let wordPair = new Set(wordStems[i], wordStems[j]);
      incrKey( wordPairMap, wordPair );
    }
  }

  let words = wordStems.map( ws => {
    let associatedWords = [...stemToWordsMap.get( ws )].sort( (w0, w1 ) => {
      return wordOccurenceMap.get(w1) > wordOccurenceMap.get(w0);
    } );

    return associatedWords[0];
  });

  return words.filter( word => wordOccurenceMap.get(word) > 1 );
};


let defaults = {
  stopWords: [],
  flaggedWords: [],
  delimiters: [],
  useStemming: true
};

let generateClusterLabels = (text, opts) => {
  opts = _.assign({}, defaults, opts);
  let result = textCharacterization(text, opts);
  return result;
};

module.exports = {
  generateClusterLabels
};