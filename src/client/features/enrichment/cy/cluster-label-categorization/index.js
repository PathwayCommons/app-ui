const _ = require('lodash');

const { stemmer } = require('porter-stemmer');
const stopWords = require('./stopwords.json');
const flaggedWords = require('./flaggedwords.json');



// This module summarizes text for a enrichment cluster.
// Here is the general algorithm:
//   Input Sanitization
//     1. tokenize by a list of delimiters e.g. tabs, spaces, newlines, special characters
//     2. filter the tokens for stop words or flagged words
//   Preprocessing
//     3. compute the occurences of each token
//     4. compute the word stem of the token using the Porter Stemmer Algorithm
//     5. associate each stem with the original token
//   Selection
//     6. for each stem, get the token associated with the most occurences

// For more context/information:
//    https://tagcrowd.com/faq.html#howto
//    http://wordcloud.cs.arizona.edu/faq.html#q-how-it-works
//    http://snowball.tartarus.org/algorithms/porter/stemmer.html


// Input:  String --  representing text labels of pathway names of a given component
// Output: Array of strings -- representing the most common words that are not stop words or flagged words
let generateClusterLabels = text => {
  let delimiterRegex = /[\t \n\r\f!\\#$%&()*+,.<=>?@[^\\\]`_{|}~\\'"]/;
  let filterWords = new Set([...stopWords, flaggedWords]);
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

  // input sanitization
  let tokens = text.split(delimiterRegex).filter( word => !filterWords.has(word) && word !== '' );

  // preprocess the tokens -- compute word occurences, compute word stems
  let wordStems = _.uniq(tokens.map( token => {
    incrKey( wordOccurenceMap, token );
    let wordStem = stemmer( token.toLowerCase() );
    appendKey( stemToWordsMap, wordStem, token );
    return wordStem;
   } ) );

  // for each stem, get its associated tokens and return the token with the most occurences
  let words = wordStems.map( ws => {
    let associatedWords = [...stemToWordsMap.get( ws )].sort( (w0, w1 ) => {
      return wordOccurenceMap.get(w1) > wordOccurenceMap.get(w0);
    } );

    return associatedWords[0];
  });

  // return all words that appear at least once
  return words.filter( word => wordOccurenceMap.get(word) > 1 );
};

module.exports = {
  generateClusterLabels
};