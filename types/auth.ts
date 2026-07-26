export interface SampleUserSlot {
  slot: number;
  label?: string;
  customerId?: string;
}

export interface SampleUser {
  id: string;
  label: string;
  customerId: string;
}

/**
 * Outcome of the CereMeet watersLogin exchange: a CRM customer id in, that customer's
 * access token out. `reason` is a non-secret code and never echoes the token or the API key.
 */
export interface WatersLoginResult {
  ok: boolean;
  accessToken?: string;
  email?: string;
  reason?: string;
}

/**
 * Outcome of the CereMeet `/api/users/me` check. `reason` is always a non-secret code
 * that mirrors the backend gate (CAICore `widget_auth.WidgetAuthResult`) so a failure
 * shown here matches what the backend would have reported. It never echoes the token.
 */
export interface CereMeetVerification {
  authenticated: boolean;
  email?: string;
  consumerId?: string;
  isWatersUser: boolean;
  reason?: string;
}

/**
 * An authenticated session. Held in memory only for the lifetime of the app process —
 * the bearer token is never written to storage, logs, or route params.
 */
export interface AuthSession {
  token: string;
  email: string;
  consumerId: string;
  label: string;
}
