/** All UI text (Hebrew). One place, so wording can be changed without touching components. */
export const S = {
  // Main screen
  noCase: 'לא נבחר תיק',
  loading: 'טוען…',
  searchPlaceholder: 'חפש/י כאן... עבירה',
  filterTooltip: 'סינון לפי חוק',
  refreshTooltip: 'רענון',
  addTooltip: 'הוספת עבירה',
  editTooltip: 'עריכה',
  deleteTooltip: 'מחיקה',
  colLaw: 'חוק',
  colSection: 'סעיף',
  colDetails: 'פירוט',
  colActions: 'פעולות',
  emptyNoData: 'אין נתונים זמינים',
  emptyNoMatch: 'לא נמצאו עבירות התואמות את החיפוש',
  retry: 'נסו שוב',
  tableLabel: 'עבירות בתיק',

  // Filter callout
  filterLawLabel: 'חוק',
  filterAllLaws: 'כל החוקים',

  // Add / edit form
  addTitle: 'הוספת עבירה',
  editTitle: 'עריכת עבירה',
  lawLabel: 'חוק',
  lawPlaceholder: 'בחר/י חוק',
  sectionLabel: 'סעיף',
  sectionPlaceholder: 'בחר/י סעיף',
  sectionNeedsLaw: 'בחר/י חוק קודם',
  sectionSearchPlaceholder: 'חפש/י סעיף...',
  sectionsNoResults: 'לא נמצאו סעיפים',
  sectionsLoading: 'טוען סעיפים…',
  sectionsCount: (shown: number, total: number): string =>
    shown === total ? `${total} סעיפים` : `${shown} מתוך ${total} סעיפים`,
  sectionLegacyHint: 'הערך הנוכחי אינו מופיע ברשימת הסעיפים של החוק. אפשר להשאיר אותו כפי שהוא או לבחור סעיף מהרשימה.',
  sectionLawUnknownHint: 'החוק השמור אינו ברשימת החוקים הנתמכת. אפשר להשאיר אותו כפי שהוא או לבחור חוק מהרשימה.',
  detailsLabel: 'פירוט',
  save: 'שמירה',
  cancel: 'ביטול',
  saving: 'שומר…',
  fieldRequired: 'שדה חובה',
  requiredLawAndSection: 'יש לבחור חוק וסעיף',
  duplicateOffence: 'עבירה זו כבר קיימת בתיק',
  closePanel: 'סגירה',

  // Delete dialog
  deleteTitle: 'מחיקת עבירה',
  deleteBody: 'מחיקת העבירה היא סופית ולא ניתן יהיה לשחזר אותה. האם להמשיך?',
  deleteConfirm: 'מחיקה',
  deleting: 'מוחק…',
  deleteLawLabel: 'חוק',
  deleteSectionLabel: 'סעיף',

  // Case resolution
  caseNameNotFound: (name: string): string => `לא נמצא תיק בשם "${name}".`,
  testCaseNotFound: (value: string): string => `לא נמצא תיק עבור הערך "${value}" (מזהה תיק או שם תיק).`,

  // Errors
  errPermission: 'אין לך הרשאה לבצע פעולה זו. יש לפנות למנהל/ת המערכת.',
  errNetwork: 'אירעה שגיאת תקשורת. יש לבדוק את החיבור לרשת ולנסות שוב.',
  errNotFound: 'הרשימה או הפריט המבוקשים לא נמצאו. ייתכן שהפריט נמחק או ששם הרשימה שונה.',
  errThrottled: 'השרת עמוס כרגע. יש לנסות שוב בעוד מספר רגעים.',
  errConflict: 'הפריט שונה על ידי משתמש אחר. יש לרענן ולנסות שוב.',
  errUnknown: 'אירעה שגיאה בלתי צפויה.',
  errDetailPrefix: 'פרטים טכניים: ',
  errLoadCase: 'טעינת התיק נכשלה.',
  errLoadItems: 'טעינת העבירות נכשלה.',
  errLoadSections: 'טעינת הסעיפים נכשלה.',
  errSave: 'שמירת העבירה נכשלה.',
  errDelete: 'מחיקת העבירה נכשלה.',

  // Property pane
  paneGroupTitle: 'הגדרות',
  paneTestCaseLabel: 'תיק לבדיקה',
  paneTestCaseDescription:
    'מזהה תיק (ID) או שם תיק (caseName). משמש רק לבדיקה בדף שאין בו תיק בכתובת. פרמטר מהכתובת קודם לערך זה.',
  paneCaseIdParamLabel: 'שם פרמטר מזהה התיק בכתובת',
  paneCaseNameParamLabel: 'שם פרמטר שם התיק בכתובת'
};
