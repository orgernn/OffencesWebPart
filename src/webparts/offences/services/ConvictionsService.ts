import { SPFI } from '@pnp/sp';
import { IList } from '@pnp/sp/lists';
import { CONVICTIONS_LIST_TITLE, CONVICTION_FIELDS as F, LAWS } from '../config';
import { IConviction, IConvictionInput } from '../models';
import { escapeODataString } from '../utils/odata';
import { describeError } from './errors';

/** SharePoint sends null for empty columns, so every column is read defensively. */
interface IConvictionRow {
  Id: number;
  lawSource?: unknown;
  section?: unknown;
  details?: unknown;
  caseRef?: { Id: number };
}

function asText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return typeof value === 'string' ? value : '';
}

/** The offences attached to a case (the Convictions list). */
export class ConvictionsService {
  /** Becomes true if SharePoint ever rejects an add because Title is required. */
  private titleRequired = false;

  constructor(private readonly sp: SPFI) {}

  private get list(): IList {
    return this.sp.web.lists.getByTitle(CONVICTIONS_LIST_TITLE);
  }

  /** All offences of one case. */
  public async getForCase(caseId: number): Promise<IConviction[]> {
    const rows = (await this.list.items
      .select('Id', F.lawSource, F.section, F.details, `${F.caseRef}/Id`)
      .expand(F.caseRef)
      .filter(`${F.caseRef}/Id eq ${caseId}`)
      .getAll()) as IConvictionRow[];

    return rows.map((row) => ({
      id: row.Id,
      caseId: row.caseRef ? row.caseRef.Id : caseId,
      lawSource: asText(row.lawSource),
      section: asText(row.section),
      details: asText(row.details)
    }));
  }

  /**
   * Is there already an offence with the same law and the same section text on this case?
   * @param excludeId the item being edited, which must not count as its own duplicate
   */
  public async findDuplicate(
    caseId: number,
    lawSource: string,
    section: string,
    excludeId?: number
  ): Promise<IConviction | undefined> {
    let filter =
      `${F.caseRef}/Id eq ${caseId}` +
      ` and ${F.lawSource} eq '${escapeODataString(lawSource)}'` +
      ` and ${F.section} eq '${escapeODataString(section)}'`;
    if (excludeId !== undefined) {
      filter += ` and Id ne ${excludeId}`;
    }

    const rows = (await this.list.items
      .select('Id', F.lawSource, F.section, F.details, `${F.caseRef}/Id`)
      .expand(F.caseRef)
      .filter(filter)
      .top(1)()) as IConvictionRow[];

    if (rows.length === 0) {
      return undefined;
    }
    return {
      id: rows[0].Id,
      caseId,
      lawSource: asText(rows[0].lawSource),
      section: asText(rows[0].section),
      details: asText(rows[0].details)
    };
  }

  /**
   * Creates an offence. Title is not set: the list is expected not to require it.
   * If SharePoint rejects the save because Title is required, it is retried with Title = section text.
   */
  public async add(caseId: number, input: IConvictionInput): Promise<void> {
    const fields: { [name: string]: unknown } = {
      [F.caseRefId]: caseId,
      [F.lawSource]: input.lawSource,
      [F.section]: input.section,
      [F.details]: input.details
    };

    if (this.titleRequired) {
      fields.Title = input.section;
    }

    try {
      await this.list.items.add(fields);
    } catch (err) {
      if (this.titleRequired || !this.isTitleRequiredError(err)) {
        throw err;
      }
      this.titleRequired = true;
      console.warn(
        '[Offences] SharePoint rejected the new item because the column "Title" is required in the ' +
          `"${CONVICTIONS_LIST_TITLE}" list. Retrying with Title = the section text. ` +
          'Consider making Title optional in that list.'
      );
      await this.list.items.add({ ...fields, Title: input.section });
    }
  }

  public async update(id: number, input: IConvictionInput): Promise<void> {
    await this.list.items.getById(id).update({
      [F.lawSource]: input.lawSource,
      [F.section]: input.section,
      [F.details]: input.details
    });
  }

  /** Permanent delete (item.delete(), NOT recycle()). It cannot be undone. */
  public async delete(id: number): Promise<void> {
    await this.list.items.getById(id).delete();
  }

  /**
   * Compares the laws in config.ts with the real choices of Convictions.lawSource and warns
   * (console.warn) about every mismatch. Never throws: it is a diagnostic only.
   */
  public async checkLawChoices(): Promise<void> {
    try {
      const field = (await this.list.fields.getByInternalNameOrTitle(F.lawSource).select('Choices')()) as {
        Choices?: string[];
      };
      const choices = field.Choices || [];
      const configured = LAWS.map((law) => law.lawSource);

      for (const law of configured) {
        if (choices.indexOf(law) === -1) {
          console.warn(
            `[Offences] lawSource mismatch: "${law}" (config.ts) is not a choice of ${CONVICTIONS_LIST_TITLE}.${F.lawSource}. ` +
              `Saving it would fail or store a value the list does not offer. Choices: ${JSON.stringify(choices)}`
          );
        }
      }
      for (const choice of choices) {
        if (configured.indexOf(choice) === -1) {
          console.warn(
            `[Offences] lawSource mismatch: the choice "${choice}" of ${CONVICTIONS_LIST_TITLE}.${F.lawSource} is not in config.ts LAWS, ` +
              'so it cannot be picked in this web part.'
          );
        }
      }
    } catch (err) {
      console.warn('[Offences] Could not read the choices of lawSource to validate config.ts.', err);
    }
  }

  private isTitleRequiredError(err: unknown): boolean {
    const text = describeError(err).detail;
    return /\btitle\b/i.test(text) && /(required|requires|mandatory|must (have|contain) a value|cannot be (null|empty|blank))/i.test(text);
  }
}
