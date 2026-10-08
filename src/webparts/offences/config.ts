/**
 * Single place for every name that is tied to the SharePoint data model.
 * Nothing here creates or changes a list: all lists already exist.
 */

/** Display titles of the existing lists (resolved with lists.getByTitle). */
export const CASES_LIST_TITLE = 'Cases';
export const CONVICTIONS_LIST_TITLE = 'Convictions';

/** Cases: unique key column. */
export const CASE_NAME_FIELD = 'caseName';

/** Convictions: internal column names. */
export const CONVICTION_FIELDS = {
  /** Lookup to Cases.caseName. Read as caseRef/Id, written as caseRefId. */
  caseRef: 'caseRef',
  caseRefId: 'caseRefId',
  /** Choice. Plain copied text. */
  lawSource: 'lawSource',
  /** Single line of text. Plain copied text. */
  section: 'section',
  /** Multiple lines of text (plain). */
  details: 'details'
} as const;

/**
 * Column of a law list that holds the section label ("סעיף 12 - סמכות שופט").
 * The same text is shown in the picker and stored in Convictions.section.
 */
export const SECTION_FIELD = 'Title';

/** Default names of the URL query-string parameters (editable in the property pane). */
export const DEFAULT_CASE_ID_PARAM = 'caseId';
export const DEFAULT_CASE_NAME_PARAM = 'caseName';

/** Primary color: the blue of the "עבור לתיק" button. */
export const PRIMARY_COLOR = '#3560D8';

export interface ILaw {
  /** Exact Choice value of Convictions.lawSource. No quote marks inside the names. */
  lawSource: string;
  /** Title of the read-only list that holds the law's sections. */
  listTitle: string;
}

/** The eight laws, in display order. */
export const LAWS: ReadonlyArray<ILaw> = [
  { lawSource: 'חוק העונשין', listTitle: 'חוק העונשין נוסח מלא' },
  { lawSource: 'חוק למניעת הטרדה מינית', listTitle: 'חוק למניעת הטרדה מינית' },
  { lawSource: 'חסדפ כללי', listTitle: 'חסדפ כללי' },
  { lawSource: 'חסדפ מעצרים', listTitle: 'חסדפ מעצרים' },
  { lawSource: 'חשצ', listTitle: 'חשצ' },
  { lawSource: 'פקודת התעבורה', listTitle: 'פקודת התעבורה' },
  { lawSource: 'תקנות התעבורה', listTitle: 'תקנות התעבורה' },
  { lawSource: 'פקודת הסמים המסוכנים', listTitle: 'פקודת הסמים המסוכנים' }
];

export function findLaw(lawSource: string): ILaw | undefined {
  return LAWS.filter((law) => law.lawSource === lawSource)[0];
}
