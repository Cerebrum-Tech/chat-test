import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { verifyCereMeetUser, watersLogin } from '../services/ceremeetAuth';
import type { AuthSession, CereMeetVerification } from '../types/auth';

interface AuthSessionValue {
  session: AuthSession | null;
  isSigningIn: boolean;
  signIn: (customerId: string, label?: string) => Promise<CereMeetVerification>;
  signOut: () => void;
}

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

/**
 * Holds the signed-in session for the app process.
 *
 * Sign-in is the two-step CereMeet exchange: watersLogin mints the customer's access
 * token, then that token is checked against /api/users/me — the same call the backend
 * gate makes. Verifying the freshly minted token is not redundant: it is the only way to
 * catch a token that logs in but would be refused mid-conversation.
 *
 * The session lives in React state only: it is never written to AsyncStorage, SecureStore,
 * or a route param, so relaunching the app always returns to the login screen and no
 * bearer token survives the process.
 */
export const AuthSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signIn = useCallback(async (customerId: string, label?: string) => {
    setIsSigningIn(true);
    try {
      const login = await watersLogin(customerId);
      if (!login.ok || !login.accessToken) {
        setSession(null);
        return { authenticated: false, isWatersUser: false, reason: login.reason };
      }

      const result = await verifyCereMeetUser(login.accessToken);
      if (result.authenticated && result.consumerId) {
        setSession({
          token: login.accessToken,
          email: result.email ?? login.email ?? '',
          consumerId: result.consumerId,
          label: label?.trim() || result.consumerId,
        });
      } else {
        setSession(null);
      }
      return result;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(() => setSession(null), []);

  const value = useMemo(
    () => ({ session, isSigningIn, signIn, signOut }),
    [session, isSigningIn, signIn, signOut],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
};

export const useAuthSession = (): AuthSessionValue => {
  const value = useContext(AuthSessionContext);
  if (!value) throw new Error('useAuthSession must be used inside AuthSessionProvider');
  return value;
};
