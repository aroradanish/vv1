'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, Profile } from './api';

/**
 * Auth context replacing Supabase auth-state in the original app.
 * Persists the JWT + profile in localStorage; exposes login/register/logout.
 */

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Profile>;
  register: (email: string, password: string, fullName: string, role: string) => Promise<Profile>;
  logout: () => void;
  refresh: () => Promise<void>;
  setWishlist: (wishlist: string[]) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error('AuthProvider missing');
  },
  register: async () => {
    throw new Error('AuthProvider missing');
  },
  logout: () => {},
  refresh: async () => {},
  setWishlist: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('villa_token')) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
      localStorage.setItem('villa_wishlist_ids', JSON.stringify(me.wishlist || []));
    } catch {
      // Token invalid/expired
      localStorage.removeItem('villa_token');
      localStorage.removeItem('villa_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Restore cached user instantly, then validate against the API.
    const cached = localStorage.getItem('villa_user');
    if (cached && localStorage.getItem('villa_token')) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        /* ignore */
      }
    }
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: profile, session } = await api.login(email, password);
    localStorage.setItem('villa_token', session.access_token);
    localStorage.setItem('villa_user', JSON.stringify(profile));
    localStorage.setItem('villa_wishlist_ids', JSON.stringify(profile.wishlist || []));
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName: string, role: string) => {
      const { user: profile, session } = await api.register(email, password, fullName, role);
      localStorage.setItem('villa_token', session.access_token);
      localStorage.setItem('villa_user', JSON.stringify(profile));
      localStorage.setItem('villa_wishlist_ids', JSON.stringify(profile.wishlist || []));
      setUser(profile);
      return profile;
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('villa_token');
    localStorage.removeItem('villa_user');
    setUser(null);
  }, []);

  const setWishlist = useCallback((wishlist: string[]) => {
    localStorage.setItem('villa_wishlist_ids', JSON.stringify(wishlist));
    setUser((u) => (u ? { ...u, wishlist } : u));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, setWishlist }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
