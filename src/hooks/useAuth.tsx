import { useEffect, useState } from 'react';
import { RegisterInput, LoginInput } from '@smart-link-hub/shared';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Temporary shim for user session based on standard backend schema
export interface AuthUser {
  id: string;
  email: string;
  displayName?: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token in localStorage
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setSession({ access_token: token });
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const resp = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName } as RegisterInput)
      });
      const data = await resp.json();

      if (!resp.ok) return { error: { message: data.error?.message || 'Registration failed' }, data: null };

      const { user: userResp, token } = data.data;
      if (token && userResp) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ id: userResp.id, email: userResp.email, displayName: userResp.displayName }));
        setSession({ access_token: token });
        setUser({ id: userResp.id, email: userResp.email, displayName: userResp.displayName });
      }

      return { data: userResp, error: null };
    } catch (e: any) {
      return { error: { message: e.message }, data: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const resp = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password } as LoginInput)
      });
      const data = await resp.json();

      if (!resp.ok) return { error: { message: data.error?.message || 'Login failed' }, data: null };

      const { user: userResp, token } = data.data;
      if (token && userResp) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ id: userResp.id, email: userResp.email, ...userResp }));
        setSession({ access_token: token });
        setUser({ id: userResp.id, email: userResp.email, ...userResp });
      }

      return { data: userResp, error: null };
    } catch (e: any) {
      return { error: { message: e.message }, data: null };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setSession(null);
    setUser(null);
    return { error: null };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
