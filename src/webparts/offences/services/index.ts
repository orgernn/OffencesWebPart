import { WebPartContext } from '@microsoft/sp-webpart-base';
import { CasesService } from './CasesService';
import { ConvictionsService } from './ConvictionsService';
import { LawSectionsService } from './LawSectionsService';
import { createSp } from './pnp';

export { CasesService } from './CasesService';
export type { CaseResolution, CaseSource, IResolveCaseOptions } from './CasesService';
export { ConvictionsService } from './ConvictionsService';
export { LawSectionsService } from './LawSectionsService';
export { reportError, toUserMessage, describeError } from './errors';

/** Everything the UI needs from SharePoint. Components receive this, so they can be tested with fakes. */
export interface IServices {
  cases: CasesService;
  convictions: ConvictionsService;
  sections: LawSectionsService;
}

export function createServices(context: WebPartContext): IServices {
  const sp = createSp(context);
  return {
    cases: new CasesService(sp),
    convictions: new ConvictionsService(sp),
    sections: new LawSectionsService(sp)
  };
}
