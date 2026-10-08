/** One offence attached to a case (an item of the Convictions list). */
export interface IConviction {
  /** Convictions item ID. */
  id: number;
  /** Cases item ID (Convictions.caseRef). */
  caseId: number;
  /** Convictions.lawSource: plain copied text. */
  lawSource: string;
  /** Convictions.section: plain copied text. */
  section: string;
  /** Convictions.details: plain multi-line text. */
  details: string;
}

/** The editable part of a Conviction. */
export interface IConvictionInput {
  lawSource: string;
  section: string;
  details: string;
}
