
import { describe, test, expect } from '@jest/globals';
import { Language } from '../modules/language-en-us.mjs';

// Language class is stateless, so we initialize it only once
let lang;

beforeAll( async () => {
    lang = new Language();
    await lang.loadDictionary("./dictionaries/en-us.txt");
});

describe('Word phonemization', () => {
      
    test.each([
        ['', ""],
        ['AND', "ən"],
        ['MERCHANDISE', 'mˈɜɹʧəndˌIz'],
        ['NOTINDICTIONARY', "nɑtIndɪkʃənɛɹi"],
    ])('phonemizeWord("%s") ➝ %s', async (input, expected) => {
        expect(lang.phonemizeWord(input).join("")).toEqual(expected);
    });

});

describe('Number to words', () => {
  
    test.each([
        ['-1', "MINUS ONE"],
        ['0', "ZERO"],
        ['11', "ELEVEN"],
        ['1000', "ONE THOUSAND"],
        ['-463', "MINUS FOUR SIX THREE"],
        ['12.532', "TWELVE POINT FIVE THREE TWO"],
        ['100', "ONE HUNDRED"],
        ['300', "THREE HUNDRED"],
        ['0.5', "ZERO POINT FIVE"],
        ['-0.25', "MINUS ZERO POINT TWO FIVE"]
    ])('convertNumberToWords("%s") ➝ %s', (input, expected) => {
        expect(lang.convertNumberToWords(input)).toEqual(expected);
    });

});

describe('Generate data', () => {
 
    test('Text input 1', async () => {
        const lang = new Language();
        await lang.loadDictionary("./dictionaries/en-us.txt");
        const result = lang.generate("I'm just testing.");
        expect(result.phonemes).toEqual(['I', 'm', ' ', 'ʤ', 'ˈ', 'ʌ', 's', 't', ' ', 't', 'ˈ', 'ɛ', 's', 't', 'ɪ', 'ŋ', '.']);
        expect(result.metadata.words).toEqual(["I'm ", 'just ', 'testing.']);
        expect(result.metadata.wtimes).toEqual( Array(3).fill( expect.any(Number) ) );
        expect(result.metadata.wdurations).toEqual( Array(3).fill( expect.any(Number) ) );
        expect(result.metadata.visemes).toEqual(['I', 'PP', 'CH', 'aa', 'SS', 'DD', 'DD', 'E', 'SS', 'DD', 'I', 'nn']);
        expect(result.metadata.vtimes).toEqual( Array(12).fill( expect.any(Number) ) );
        expect(result.metadata.vdurations).toEqual( Array(12).fill( expect.any(Number) ) );
    });

});
