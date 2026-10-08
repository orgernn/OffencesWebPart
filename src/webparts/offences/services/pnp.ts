import { spfi, SPFI, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
// items.getAll(): pages through the whole list (needed for the ~780-item law lists)
import '@pnp/sp/items/get-all';
import '@pnp/sp/fields';
import { WebPartContext } from '@microsoft/sp-webpart-base';

/**
 * PnPjs v3 bound to the web part's SPFx context.
 * No site URL is configured anywhere: the current web (the site of the page) is used.
 */
export function createSp(context: WebPartContext): SPFI {
  return spfi().using(SPFx(context));
}
