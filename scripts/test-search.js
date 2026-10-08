/* eslint-disable */
/**
 * Quick verification of utils/search.ts (no test framework needed).
 *   npm run test:search
 * It transpiles the real TypeScript source in memory with the project's TypeScript and runs assertions.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'webparts', 'offences', 'utils', 'search.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
const mod = { exports: {} };
new Function('module', 'exports', js)(mod, mod.exports);
const s = mod.exports;

let failed = 0;
function check(name, condition, detail) {
  if (condition) {
    console.log('  ok   ' + name);
  } else {
    failed++;
    console.log('  FAIL ' + name + (detail ? '   -> ' + detail : ''));
  }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log('Required checks');
const label = 'סעיף 12 - סמכות שופט';
check('"שופט" matches "' + label + '"', s.matches(label, 'שופט'));
check('"סמכות שופ" matches "' + label + '"', s.matches(label, 'סמכות שופ'));

const twelve = ['סעיף 112 - עבירה א', 'סעיף 12 - עבירה ב']; // 112 comes FIRST in the source on purpose
const normTwelve = twelve.map(s.normalize);
check('"12" ranks "סעיף 12" above "סעיף 112"', same(s.rankIndexes(normTwelve, '12'), [1, 0]), JSON.stringify(s.rankIndexes(normTwelve, '12')));
check('"סעיף 12" ranks "סעיף 12" above "סעיף 112"', same(s.rankIndexes(normTwelve, 'סעיף 12'), [1, 0]), JSON.stringify(s.rankIndexes(normTwelve, 'סעיף 12')));

check('חסד"פ matches "חסדפ"', s.matches('חסדפ', 'חסד"פ'));
check('חסד״פ (gershayim) matches "חסדפ"', s.matches('חסדפ', 'חסד״פ'));
check('"חסדפ" matches label חסד"פ', s.matches('חסד"פ כללי', 'חסדפ'));

console.log('normalize');
check('lowercase', s.normalize('ABC Def') === 'abc def');
check('niqqud removed', s.normalize('סְמַכּוּת') === 'סמכות', s.normalize('סְמַכּוּת'));
check('quotes removed (", \', ״, ׳)', s.normalize('חסד"פ ח\'ק ד״ר ג׳') === 'חסדפ חק דר ג');
check('hyphen -> space', s.normalize('סעיף 12 - סמכות') === 'סעיף 12 סמכות', s.normalize('סעיף 12 - סמכות'));
check('en dash / em dash / maqaf -> space', s.normalize('א–ב—ג־ד') === 'א ב ג ד', s.normalize('א–ב—ג־ד'));
check('whitespace collapsed and trimmed', s.normalize('  א   ב \t ג  ') === 'א ב ג');
check('empty stays empty', s.normalize('') === '' && same(s.tokenize('   '), []));

console.log('matching');
check('word in the middle matches', s.matches(label, 'סמכות'));
check('any order', s.matches(label, 'שופט 12 סעיף'));
check('every token must match', !s.matches(label, 'שופט מאסר'));
check('empty query matches everything', s.matches(label, '') && s.matches(label, '   '));
check('niqqud in the label is ignored', s.matches('סְמַכּוּת שׁוֹפֵט', 'סמכות שופט'));
check('case-insensitive', s.matches('Section ABC', 'abc'));
check('no match -> filterIndexes is empty', same(s.filterIndexes(['א ב', 'ג ד'], 'זזז'), []));
check('filterIndexes keeps source order', same(s.filterIndexes(['א ב', 'ג ד', 'א ג'], 'א'), [0, 2]));

console.log('ranking');
const labels = [
  'סעיף 5 - מאסר',        // 0: substring only for "אסר" -> rank 3
  'אסרו ראשון',           // 1: starts with token  -> rank 2
  'סעיף 7 - אסר',         // 2: whole word         -> rank 0
  'סעיף 8 - מאסר מותנה'   // 3: substring only     -> rank 3
].map(s.normalize);
check('whole word > starts-with > substring, source order inside a rank',
  same(s.rankIndexes(labels, 'אסר'), [2, 1, 0, 3]), JSON.stringify(s.rankIndexes(labels, 'אסר')));
check('empty query keeps source order', same(s.rankIndexes(labels, ''), [0, 1, 2, 3]));
check('non-matching items are dropped', same(s.rankIndexes(labels, 'חסדפ'), []));
const e12 = ['סעיף 120', 'סעיף 12', 'סעיף 112', 'סעיף 12א'].map(s.normalize);
check('"12": exact "12" first, then the others in source order', same(s.rankIndexes(e12, '12'), [1, 0, 2, 3]), JSON.stringify(s.rankIndexes(e12, '12')));

console.log('highlight');
const seg = (t, q) => s.highlightSegments(t, s.tokenize(q)).filter((x) => x.highlight).map((x) => x.text);
check('highlights the matched text', same(seg(label, 'סמכות שופ'), ['סמכות', 'שופ']), JSON.stringify(seg(label, 'סמכות שופ')));
check('highlight covers the quote in חסד"פ', same(seg('חסד"פ כללי', 'חסדפ'), ['חסד"פ']), JSON.stringify(seg('חסד"פ כללי', 'חסדפ')));
check('segments rebuild the original text', s.highlightSegments(label, s.tokenize('12 שופט')).map((x) => x.text).join('') === label);
check('no tokens -> one plain segment', same(s.highlightSegments(label, []), [{ text: label, highlight: false }]));
check('niqqud stays attached to its letter', same(seg('סְמַכּוּת', 'סמכות'), ['סְמַכּוּת']), JSON.stringify(seg('סְמַכּוּת', 'סמכות')));

console.log(failed === 0 ? '\nAll checks passed.' : '\n' + failed + ' check(s) FAILED.');
process.exit(failed === 0 ? 0 : 1);
