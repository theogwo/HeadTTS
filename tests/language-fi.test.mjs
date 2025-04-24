
import { describe, test, expect } from '@jest/globals';
import { Language } from '../modules/language-fi.mjs';

// Language class is stateless, so we initialize it only once
let lang;

beforeAll( async () => {
    lang = new Language();
    // NOTE: The Finnish language module doesn't need a dictionary
    await lang.loadDictionary("./dictionaries/fi.txt");
});

describe('Word phonemization', () => {

    const lang = new Language();
      
    test.each([
        ['', ""],
        ['JA', "ˈjɑ"],
        ['JÄÄHYAITIO', "ˈjæːhyɑitio"],
        ['KEHITYSYHTEISTYÖ', "ˈkehitysyhteistyø"],
    ])('phonemizeWord("%s") ➝ %s', (input, expected) => {
        expect(lang.phonemizeWord(input).join("")).toEqual(expected);
    });

});

describe('Number to words', () => {

    const lang = new Language();
      
    test.each([
        ['-1', "MIINUS YKSI"],
        ['0', "NOLLA"],
        ['11', "YKSITOISTA"],
        ['1000', "TUHAT"],
        ['-463', "MIINUS NELJÄSATAAKUUSIKYMMENTÄKOLME"],
        ['12.5', "KAKSITOISTA PILKKU VIISI"],
    ])('convertNumberToWords("%s") ➝ %s', (input, expected) => {
        expect(lang.convertNumberToWords(input)).toEqual(expected);
    });

});

describe('Generate data', () => {

    const lang = new Language();
      
    test('Text input 1', () => {
        const result = lang.generate('Tämä on testilause.');
        expect(result.phonemes).toEqual(["ˈ","t","æ","m","æ"," ","ˈ","o","n"," ","ˈ","t","e","s","t","i","l","ɑ","u","s","e",".",]);
        expect(result.metadata.words).toEqual(['Tämä ','on ','testilause.']);
        expect(result.metadata.wtimes).toEqual( Array(3).fill( expect.any(Number) ) );
        expect(result.metadata.wdurations).toEqual( Array(3).fill( expect.any(Number) ) );
        expect(result.metadata.visemes).toEqual(['DD', 'aa', 'PP', 'aa', 'O', 'nn', 'DD', 'E', 'SS', 'DD', 'I', 'RR', 'aa', 'U', 'SS', 'E']);
        expect(result.metadata.vtimes).toEqual( Array(16).fill( expect.any(Number) ) );
        expect(result.metadata.vdurations).toEqual( Array(16).fill( expect.any(Number) ) );
    });

});
