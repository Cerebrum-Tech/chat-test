import type { CereMeetVerification, WatersLoginResult } from '../types/auth';

export const CEREMEET_USER_ME_URL = 'https://api.ceremeet.com/api/users/me';
export const CEREMEET_WATERS_LOGIN_URL = 'https://api.ceremeet.com/api/auth/watersLogin';

const DEFAULT_TIMEOUT_MS = 10000;

export interface VerifyOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface WatersLoginOptions extends VerifyOptions {
  /** The watersLogin service key. Defaults to the configured EXPO_PUBLIC value. */
  apiKey?: string;
}

/**
 * Exchange a CRM customer id for that customer's CereMeet access token.
 *
 * This is the "log in as customer X" half of the flow: the service key authorizes the
 * exchange itself, and the returned `access_token` is the per-user credential the widget
 * and backend then work with. The service key is sent as a header and never logged, but
 * note that Expo bakes it into the client bundle — see env.sample.
 */
export const watersLogin = async (
  customerId: string,
  { apiKey, fetchImpl, timeoutMs = DEFAULT_TIMEOUT_MS }: WatersLoginOptions = {},
): Promise<WatersLoginResult> => {
  const id = typeof customerId === 'string' ? customerId.trim() : '';
  if (!id) return { ok: false, reason: 'missing_customer_id' };

  const key = (apiKey ?? process.env.EXPO_PUBLIC_CAI_WATERS_LOGIN_KEY ?? '').trim();
  if (!key) return { ok: false, reason: 'missing_login_key' };

  const doFetch = fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await doFetch(CEREMEET_WATERS_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ customer_id: id }),
      signal: controller.signal,
    });
  } catch {
    return { ok: false, reason: 'ceremeet_login_unreachable' };
  } finally {
    clearTimeout(timer);
  }

  if (response.status !== 200) return { ok: false, reason: `ceremeet_login_status_${response.status}` };

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, reason: 'ceremeet_login_invalid_response' };
  }

  const body = payload as { access_token?: unknown; userInfo?: { email?: unknown } };
  const accessToken = typeof body?.access_token === 'string' ? body.access_token.trim() : '';
  if (!accessToken) return { ok: false, reason: 'no_token_in_login_response' };

  return {
    ok: true,
    accessToken,
    email: typeof body?.userInfo?.email === 'string' ? body.userInfo.email : undefined,
  };
};

/**
 * The CRM consumer id is the local part of the CereMeet email — the same derivation the
 * backend performs (`consumer_id = email.split('@')[0]`). Deriving it here too lets the
 * login screen show which customer a token resolves to before entering chat.
 */
export const deriveConsumerId = (email: string): string => email.split('@')[0] ?? '';

const failure = (reason: string, extra: Partial<CereMeetVerification> = {}): CereMeetVerification => ({
  authenticated: false,
  isWatersUser: false,
  reason,
  ...extra,
});

/**
 * Run the same authorization check the backend runs, against the live CereMeet API.
 *
 * This is a pre-flight of `CAICore/src/infra/external/ceremeet/widget_auth.verify_widget_user`:
 * a token that fails here would be rejected by the backend on the first chat turn, so the
 * login screen can surface the reason immediately instead of the user meeting a generic
 * unauthorized template mid-conversation. Reason codes are kept byte-identical to the
 * backend's so the two are directly comparable.
 *
 * The token travels in the Authorization header only and is never logged.
 */
export const verifyCereMeetUser = async (
  accessToken: string,
  { fetchImpl, timeoutMs = DEFAULT_TIMEOUT_MS }: VerifyOptions = {},
): Promise<CereMeetVerification> => {
  const token = typeof accessToken === 'string' ? accessToken.trim() : '';
  if (!token) return failure('missing_token');

  const doFetch = fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await doFetch(CEREMEET_USER_ME_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
  } catch {
    return failure('ceremeet_api_unreachable');
  } finally {
    clearTimeout(timer);
  }

  if (response.status !== 200) return failure(`ceremeet_api_status_${response.status}`);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return failure('ceremeet_api_invalid_response');
  }

  const user = (payload as { data?: { user?: Record<string, unknown> } })?.data?.user;
  if (!user) return failure('no_user_in_response');

  const email = typeof user.email === 'string' ? user.email : '';
  const isWatersUser = user.isWatersUser === true;

  // Authorization = valid token AND isWatersUser; identity is derived from the email.
  if (!isWatersUser) return failure('not_waters_user', { email: email || undefined });

  return {
    authenticated: true,
    email,
    consumerId: deriveConsumerId(email),
    isWatersUser: true,
  };
};
