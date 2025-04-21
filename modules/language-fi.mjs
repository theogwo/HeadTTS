import { LanguageBase } from "./language.mjs"
import * as utils from "./utils.mjs";

/**
* @class Finnish language model
* @author Mika Suominen
*/

class Language extends LanguageBase {

  /**
  * @constructor
  */
  constructor( settings = null ) {
    super(settings);


    // OVERRIDE FROM BASE CLASS:
    // Allowed letters in upper case
    // NOTE: Diacritics will be removed unless added to this object.
    this.normalizedLettersUpper = {
      'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'G', 'D': 'D',
      'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K',
      'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R',
      'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y',
      'Z': 'Z', 'ß': 'SS', 'Ø': 'O', 'Æ': 'AE', 'Œ': 'OE', 'Ð': 'D',
      'Þ': 'TH', 'Ł': 'L', "Ä": "Ä", "Ö": "Ö", "Å": "Å"
    };

    // Finnish letters to phonemes
    this.finnishLettersToMisaki = {

      'A': ['ɑ'], 'AA': ['ɑ','ː'], 'E': ['e'], 'EE': ['e','ː'], 'I': ['i'],
      'II': ['i','ː'], 'O': ['o'], 'OO': ['o','ː'], 'U': ['u'], 'UU': ['u','ː'],
      'Y': ['y'], 'YY': ['y','ː'], 'Ä': ['æ'], 'ÄÄ': ['æ','ː'], 'Ö': ['ø'],
      'ÖÖ': ['ø','ː'], 'Å': ['o'], 'ÅÅ': ['o','ː'],

      'B': ['b'], 'C': ['k'], 'D': ['d'], 'F': ['f'], 'G': ['ɡ'], 'H': ['h'],
      'J': ['j'], 'K': ['k'], 'L': ['l'], 'M': ['m'], 'N': ['n'], 'P': ['p'],
      'Q': ['k'], 'R': ['r'], 'S': ['s'], 'T': ['t'], 'V': ['ʋ'],
      'W': ['ʋ'], 'X': ['k'], 'Z': ['s']

    };

    // Finnish number words
    this.numbers = [
      'nolla', 'yksi', 'kaksi', 'kolme', 'neljä', 'viisi', 'kuusi',
      'seitsemän', 'kahdeksan', 'yhdeksän', "kymmenen", "yksitoista",
      "kaksitoista", "kolmetoista", "neljätoista", "viisitoista",
      "kuusitoista", 'seitsemäntoista', 'kahdeksantoista', 'yhdeksäntoista'
    ];

    // Symbols to Finnish
    // TODO: Implement these
    this.symbols = {
      '%': 'prosenttia', '€': 'euroa', '&': 'ja', '+': 'plus',
      '$': 'dollaria'
    };

    this.symbolsReg = /[%€&\+\$]/g;

    if ( this.settings.trace ) {
      utils.trace( 'Language module "fi" initiated.' );
    }

  }

  /**
  * Load pronouncing dictionary.
  *
  * @param {string} [dictionary=null] Dictionary path/url. If null, do not use dictionaries
  * @param {boolean} [force=false] If true, re-load even if already loaded.
  */
  async loadDictionary( dictionary = null, force = false ) {
    // No need for library, we can handle Finnish without it (hopefully)
    if ( this.settings.trace ) {
      utils.trace( 'Language dictionary "' + dictionary + '" not needed.' );
    }
  }

  /**
  * Convert number to words.
  *
  * @param {number|string} num Number
  * @return {string} String
  */
  convertNumberToWords(num) {
    const w = [];
    let n = parseFloat(num);
    if ( n === undefined ) return num;
    let p = (n,z,w0,w1,w2) => {
      if ( n < z ) return n;
      const d = Math.floor(n/z);
      w.push( w0 + ((d === 1) ? w1 : this.convertNumberToWords(d.toString()) + w2) );
      return n - d * z;
    }
    if ( n < 0 ) {
      w.push('miinus ');
      n = Math.abs(n);
    }
    n = p(n,1000000000,' ','miljardi',' miljardia');
    n = p(n,1000000,' ','miljoona',' miljoonaa');
    n = p(n,1000,'', 'tuhat','tuhatta');
    n = p(n,100,' ','sata','sataa');
    if ( n > 20 ) n = p(n,10,'','','kymmentä');
    if ( n >= 1) {
      let d = Math.floor(n);
      w.push( this.numbers[d] );
      n -= d;
    }
    if ( n >= 0 && Math.abs(parseFloat(num)) < 1) w.push( 'nolla' );
    if ( n > 0 ) {
      let d = num.split(',');
      if ( d.length > 1 ) {
        w.push( ' pilkku' );
        let c = [...d[d.length-1]];
        for( let i=0; i<c.length; i++ ) {
          w.push( ' ' + this.numbers[c[i]] );
        }
      }
    }
    return w.join('').trim();
  }


  /**
  * Convert graphemes to phonemes.
  *
  * @param {string} s Word
  * @return {string[]} Array of phonemes
  */
  phonemizeWord(s) {
    let phonemes = [];
    if ( s.length ) {
      const chars = [...s];
      let len = chars.length;
      let i = 0;
      let isFirstLetter = true;
      while( i < len ) {
        const isFirst = i === 0;
        const isLast = i === (len-1);
        const c = chars[i];
        const cTwo = isLast ? null : (c + chars[i+1]);

        if ( this.finnishLettersToMisaki.hasOwnProperty(cTwo) ) {
          if ( isFirstLetter ) {
            isFirstLetter = false;
            phonemes.push( "ˈ" );
          }
          phonemes.push( ...this.finnishLettersToMisaki[cTwo] );
          i += 2;
        } else if ( this.finnishLettersToMisaki.hasOwnProperty(c) ) {
          if ( isFirstLetter ) {
            isFirstLetter = false;
            phonemes.push( "ˈ" );
          }
          phonemes.push( ...this.finnishLettersToMisaki[c] );
          i++;
        } else {
          phonemes.push( c );
          i++;
          isFirstLetter = true;
        }
      }
      if ( this.settings.trace ) {
        utils.trace( 'Rules: "' + s + '" => "' + phonemes.join("") + '"' );
      }
    }
    return phonemes;
  }

}

export { Language };
