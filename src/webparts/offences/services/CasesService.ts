import { SPFI } from '@pnp/sp';
import { CASES_LIST_TITLE, CASE_NAME_FIELD } from '../config';
import { S } from '../strings';
import { escapeODataString } from '../utils/odata';
import { getQueryParam } from '../utils/query';

export type CaseSource = 'caseId' | 'caseName' | 'testCase';

export type CaseResolution =
  /** The case exists: this is its Cases item ID. */
  | { kind: 'found'; caseId: number; caseName: string; source: CaseSource }
  /** Nothing was given anywhere (or the given caseId does not exist): show "לא נבחר תיק". */
  | { kind: 'none' }
  /** A caseName (URL or test value) was given but no such case exists: show an error. */
  | { kind: 'notFound'; message: string };

export interface IResolveCaseOptions {
  /** Name of the URL parameter that carries the Cases item ID. */
  caseIdParam: string;
  /** Name of the URL parameter that carries Cases.caseName. */
  caseNameParam: string;
  /** Web part property "תיק לבדיקה": a case ID or a caseName. */
  testCase: string;
  /** Query string to read. Defaults to window.location.search. */
  search?: string;
}

interface ICaseRow {
  Id: number;
  [field: string]: unknown;
}

function parseId(raw: string): number | undefined {
  return /^\d+$/.test(raw.trim()) ? parseInt(raw.trim(), 10) : undefined;
}

export class CasesService {
  constructor(private readonly sp: SPFI) {}

  /**
   * Resolves the open case to its Cases item ID, in this order:
   *  1. URL query string caseId
   *  2. URL query string caseName
   *  3. the "תיק לבדיקה" property (ID or caseName)
   */
  public async resolveCase(options: IResolveCaseOptions): Promise<CaseResolution> {
    const search = options.search !== undefined ? options.search : window.location.search;

    // 1. caseId
    const rawId = getQueryParam(search, options.caseIdParam);
    if (rawId !== undefined) {
      const id = parseId(rawId);
      if (id === undefined) {
        console.warn(`[Offences] URL parameter "${options.caseIdParam}" is not a number: "${rawId}". Ignored.`);
      } else {
        const found = await this.findById(id, 'caseId');
        if (found) {
          return found;
        }
        console.warn(`[Offences] No case with ID ${id} in "${CASES_LIST_TITLE}". Trying the next source.`);
      }
    }

    // 2. caseName
    const rawName = getQueryParam(search, options.caseNameParam);
    if (rawName !== undefined) {
      const found = await this.findByName(rawName, 'caseName');
      return found || { kind: 'notFound', message: S.caseNameNotFound(rawName) };
    }

    // 3. test property: an ID first, then a name (a caseName may itself be numeric)
    const test = (options.testCase || '').trim();
    if (test !== '') {
      const id = parseId(test);
      if (id !== undefined) {
        const byId = await this.findById(id, 'testCase');
        if (byId) {
          return byId;
        }
      }
      const byName = await this.findByName(test, 'testCase');
      return byName || { kind: 'notFound', message: S.testCaseNotFound(test) };
    }

    return { kind: 'none' };
  }

  private findById(id: number, source: CaseSource): Promise<CaseResolution | undefined> {
    return this.query(`Id eq ${id}`, source);
  }

  private findByName(name: string, source: CaseSource): Promise<CaseResolution | undefined> {
    return this.query(`${CASE_NAME_FIELD} eq '${escapeODataString(name)}'`, source);
  }

  /** A filter (instead of getById) returns [] for a missing item and only fails when the list itself is wrong. */
  private async query(filter: string, source: CaseSource): Promise<CaseResolution | undefined> {
    const rows = (await this.sp.web.lists
      .getByTitle(CASES_LIST_TITLE)
      .items.select('Id', CASE_NAME_FIELD)
      .filter(filter)
      .top(1)()) as ICaseRow[];

    if (rows.length === 0) {
      return undefined;
    }
    const name = rows[0][CASE_NAME_FIELD];
    return { kind: 'found', caseId: rows[0].Id, caseName: typeof name === 'string' ? name : '', source };
  }
}
