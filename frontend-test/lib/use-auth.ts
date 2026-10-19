'use client';

import { useEffect, useState } from 'react';
import { apiClient, type User } from './api-client';

/** Current user from the stored JWT (null when logged out). */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!apiClient.getToken()) {
      setReady(true);
      return;
    }
    apiClient.getProfile().then(setUser).catch(() => setUser(null)).finally(() => setReady(true));
  }, []);
  return { user, ready, logout: () => { apiClient.logout(); setUser(null); } };
}
