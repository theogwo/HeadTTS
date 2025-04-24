import { LanguageBase } from "./language.mjs"
import * as utils from "./utils.mjs";

/**
* @class Finnish language module
* @author Mika Suominen
*/

class Language extends LanguageBase {

  /**
  * @constructor
  */
  constructor( settings = null ) {
    super(settings);


    // Add finnish letters with diaritics (upper case)
    // NOTE: Diacritics will be removed unless added to this object.
    Object.assign( this.normalizedLettersUpper, { "Ä": "Ä", "Ö": "Ö", "Å": "Å" } );

    // Finnish letters to phonemes
    this.fiLettersToMisaki = {

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
      'NOLLA', 'YKSI', 'KAKSI', 'KOLME', 'NELJÄ', 'VIISI', 'KUUSI',
      'SEITSEMÄN', 'KAHDEKSAN', 'YHDEKSÄN', "KYMMENEN", "YKSITOISTA",
      "KAKSITOISTA", "KOLMETOISTA", "NELJÄTOISTA", "VIISITOISTA",
      "KUUSITOISTA", 'SEITSEMÄNTOISTA', 'KAHDEKSANTOISTA', 'YHDEKSÄNTOISTA'
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
      utils.trace( 'Language dictionary not needed.' );
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
      w.push('MIINUS ');
      n = Math.abs(n);
    }
    n = p(n,1000000000,' ','MILJARDI',' MILJARDIA');
    n = p(n,1000000,' ','MILJOONA',' MILJOONAA');
    n = p(n,1000,'', 'TUHAT','TUHATTA');
    n = p(n,100,'','SATA','SATAA');
    if ( n > 20 ) n = p(n,10,'','','KYMMENTÄ');
    if ( n >= 1) {
      let d = Math.floor(n);
      w.push( this.numbers[d] );
      n -= d;
    }
    if ( n >= 0 && Math.abs(parseFloat(num)) < 1) w.push( 'NOLLA' );
    if ( n > 0 ) {
      let d = num.split('.');
      if ( d.length > 1 ) {
        w.push( ' PILKKU' );
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
    const chars = [...s];
    let len = chars.length;
    let i = 0;
    let isFirst = true;
    while( i < len ) {
      const isLast = i === (len-1);
      const c = chars[i];
      const cTwo = isLast ? null : (c + chars[i+1]);

      if ( this.fiLettersToMisaki.hasOwnProperty(cTwo) ) {
        if ( isFirst ) {
          phonemes.push( "ˈ" );
          isFirst = false;
        }
        phonemes.push( ...this.fiLettersToMisaki[cTwo] );
        i += 2;
      } else if ( this.fiLettersToMisaki.hasOwnProperty(c) ) {
        if ( isFirst ) {
          phonemes.push( "ˈ" );
          isFirst = false;
        }
        phonemes.push( ...this.fiLettersToMisaki[c] );
        i++;
      } else {
        phonemes.push( c );
        i++;
      }
    }
    if ( this.settings.trace ) {
      utils.trace( 'Rules: "' + s + '" => "' + phonemes.join("") + '"' );
    }
    return phonemes;
  }

}

export { Language };
