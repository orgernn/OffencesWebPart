/** One section of a law (an item of one of the eight law lists). */
export interface ISection {
  /** Item ID in the law list. */
  id: number;
  /** The item's Title, e.g. "סעיף 12 - סמכות שופט". Shown in the picker and stored in Convictions.section. */
  label: string;
}
