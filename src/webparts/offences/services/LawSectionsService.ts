import { SPFI } from '@pnp/sp';
import { SECTION_FIELD, findLaw } from '../config';
import { ISection } from '../models';

interface ISectionRow {
  Id: number;
  [field: string]: unknown;
}

/**
 * Reads the sections of a law from its (read-only) law list.
 * A law's items are loaded only when that law is asked for, and cached per law in memory.
 */
export class LawSectionsService {
  private readonly cache: { [lawSource: string]: Promise<ISection[]> } = {};

  constructor(private readonly sp: SPFI) {}

  /** All sections of a law, in SharePoint's default order (by ID). Not re-sorted. */
  public getSections(lawSource: string): Promise<ISection[]> {
    const law = findLaw(lawSource);
    if (!law) {
      return Promise.reject(new Error(`Unknown law "${lawSource}": it is not in config.ts LAWS.`));
    }

    if (!this.cache[lawSource]) {
      const request = this.load(law.listTitle);
      this.cache[lawSource] = request;
      // A failed load must not stay cached, so "retry" really retries.
      request.then(undefined, () => {
        if (this.cache[lawSource] === request) {
          delete this.cache[lawSource];
        }
      });
    }
    return this.cache[lawSource];
  }

  private async load(listTitle: string): Promise<ISection[]> {
    // getAll() pages through the list (the biggest has about 780 items).
    const rows = (await this.sp.web.lists
      .getByTitle(listTitle)
      .items.select('Id', SECTION_FIELD)
      .getAll()) as ISectionRow[];

    const sections: ISection[] = [];
    for (const row of rows) {
      const label = row[SECTION_FIELD];
      if (typeof label === 'string' && label.trim() !== '') {
        sections.push({ id: row.Id, label });
      }
    }
    return sections;
  }
}
