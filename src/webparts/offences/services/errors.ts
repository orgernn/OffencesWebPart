import { S } from '../strings';

export type ErrorKind = 'permission' | 'network' | 'notFound' | 'throttled' | 'conflict' | 'unknown';

export interface IErrorInfo {
  kind: ErrorKind;
  status?: number;
  /** SharePoint's own message when it can be extracted, otherwise the raw error message. */
  detail: string;
}

interface IErrorLike {
  status?: number;
  message?: string;
  response?: { status?: number };
}

function getStatus(err: IErrorLike, message: string): number | undefined {
  if (typeof err.status === 'number') {
    return err.status;
  }
  if (err.response && typeof err.response.status === 'number') {
    return err.response.status;
  }
  // PnPjs: "Error making HttpClient request in queryable [403] Forbidden ::> {...}"
  const match = /\[(\d{3})\]/.exec(message);
  return match ? parseInt(match[1], 10) : undefined;
}

/** Pulls SharePoint's readable message out of a PnPjs error ("... ::> {json}"). */
function getDetail(message: string): string {
  const separator = message.indexOf('::>');
  if (separator === -1) {
    return message;
  }
  const body = message.substring(separator + 3).trim();
  try {
    const json = JSON.parse(body) as {
      error?: { message?: { value?: string } | string };
      'odata.error'?: { message?: { value?: string } };
    };
    const nested = json['odata.error'] && json['odata.error'].message;
    if (nested && nested.value) {
      return nested.value;
    }
    const flat = json.error && json.error.message;
    if (typeof flat === 'string') {
      return flat;
    }
    if (flat && flat.value) {
      return flat.value;
    }
  } catch {
    // not JSON: fall through and show the body as is
  }
  return body || message;
}

export function describeError(err: unknown): IErrorInfo {
  const e: IErrorLike = err && typeof err === 'object' ? (err as IErrorLike) : { message: String(err) };
  const message = typeof e.message === 'string' ? e.message : String(err);
  const status = getStatus(e, message);
  const detail = getDetail(message);

  const looksLikeNetwork =
    status === 0 ||
    err instanceof TypeError ||
    /failed to fetch|networkerror|network request failed|load failed|net::err/i.test(message) ||
    (typeof navigator !== 'undefined' && navigator.onLine === false);

  let kind: ErrorKind = 'unknown';
  if (status === 401 || status === 403 || /access denied|unauthorized|forbidden/i.test(message)) {
    kind = 'permission';
  } else if (status === 404 || (status === undefined && /does not exist/i.test(message))) {
    kind = 'notFound';
  } else if (status === 429 || status === 503 || status === 504) {
    kind = 'throttled';
  } else if (status === 409 || status === 412) {
    kind = 'conflict';
  } else if (looksLikeNetwork) {
    kind = 'network';
  }

  return { kind, status, detail };
}

/** Hebrew message for the user. `context` says what was being done ("שמירת העבירה נכשלה."). */
export function toUserMessage(err: unknown, context?: string): string {
  const info = describeError(err);
  const reasons: { [kind: string]: string } = {
    permission: S.errPermission,
    network: S.errNetwork,
    notFound: S.errNotFound,
    throttled: S.errThrottled,
    conflict: S.errConflict,
    unknown: S.errUnknown
  };
  const parts: string[] = [];
  if (context) {
    parts.push(context);
  }
  parts.push(reasons[info.kind]);
  if (info.kind === 'unknown' || info.kind === 'notFound') {
    // Nothing is hidden: show what SharePoint said when we have no better explanation.
    parts.push(S.errDetailPrefix + info.detail);
  }
  return parts.join(' ');
}

/** Logs the error for developers and returns the Hebrew message for the user. Never swallows. */
export function reportError(err: unknown, context: string): string {
  console.error('[Offences] ' + context, err);
  return toUserMessage(err, context);
}
