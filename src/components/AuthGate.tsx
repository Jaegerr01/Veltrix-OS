'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import LoadingState from './LoadingState';
import { ShieldAlert, Lock, ShieldCheck } from 'lucide-react';
import { AmbientBackground, Input, Button, VxIcon, PostelMark, PostelLogo } from './ds';
import { BRAND } from '@/lib/brand';
import { asErr } from '@/lib/errors';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signOut: async () => {},
  loading: true
});

export const useAuth = () => useContext(AuthContext);

// Public registration is OFF unless explicitly enabled. PostelOS is a single-owner system (see OWNER_EMAIL);
// the server also rejects any signed-in user who is not the owner, so this only removes a dead-end button.
const ALLOW_SIGNUP = process.env.NEXT_PUBLIC_ALLOW_SIGNUP === 'true';

/** True only for requests to THIS app's own /api/ routes (never third-party URLs that merely contain "/api/"). */
export function isSameOriginApi(input: RequestInfo | URL, origin: string): boolean {
  try {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const u = new URL(raw, origin);
    return u.origin === origin && u.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detect if Supabase is properly configured in client
  const isDbOnline = !!supabase;

  useEffect(() => {
    if (!isDbOnline) {
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Intercept fetch calls to attach the session token to our own API routes.
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      // Avoid intercepting requests to the Supabase API itself to prevent infinite recursion
      const isLocalApi = isSameOriginApi(input, window.location.origin);
      
      if (isLocalApi) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          
          init = init || {};
          const headers = new Headers(init.headers || {});
          
          if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          
          // API keys, vault paths and repo slugs used to be read from
          // localStorage here and forwarded as x-* headers on every request.
          // Any XSS on any page could read them, and the server trusted them.
          // Those values now come from the server environment only.

          init.headers = headers;
        } catch (e) {
          console.warn('Failed to attach auth token to fetch request:', e);
        }
      }
      return originalFetch(input, init);
    };


    return () => {
      subscription.unsubscribe();
      window.fetch = originalFetch;
    };
  }, [isDbOnline]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDbOnline || submitting) return;
    if (isSignUp && !ALLOW_SIGNUP) { setErrorMsg('Registration is disabled for this workspace.'); return; }

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        if (data?.user && data.session === null) {
          setSuccessMsg('Account created! Please check your email to confirm registration.');
        } else {
          setSuccessMsg('Registration successful! Logging in...');
        }
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (errRaw: unknown) { const err = asErr(errRaw);
      console.warn('Authentication failed:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    if (isDbOnline) {
      await supabase.auth.signOut();
    }
  };

  if (loading) {
    return <LoadingState message="INITIATING OPERATOR IDENTITY ACCESS CHECK..." />;
  }

  // 1. Missing Supabase Config Alert
  if (!isDbOnline) {
    return (
      <div className="vx-root min-h-screen text-foreground flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'var(--ink-900)' }}>
        <AmbientBackground />
        <div className="vx-glass max-w-md w-full p-8 rounded-2xl relative overflow-hidden z-10 space-y-6" style={{ background: 'var(--grad-panel)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-xl)' }}>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon-orange via-transparent to-neon-orange" />
          <div className="flex justify-center text-neon-orange">
            <ShieldAlert size={48} className="animate-pulse" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neon-orange" style={{ fontFamily: 'var(--font-display)' }}>DB Config Offline</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Supabase parameters are missing or undefined. This system requires database connection keys to start up.
            </p>
          </div>
          <div className="p-4 bg-white/2 border border-white/5 rounded text-[11px] text-muted-foreground space-y-2 font-mono">
            <div>Ensure your <code className="text-foreground">.env.local</code> contains:</div>
            <pre className="text-[10px] text-neon-cyan overflow-x-auto select-all p-2 bg-black/40 rounded">
{`NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
          </div>
          <div className="text-center">
            <Button
              variant="secondary"
              size="md"
              onClick={() => window.location.reload()}
            >
              RECHECK CONNECTION
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Auth Screen — mirrors the Postel splash: black stage, glowing orb, light ribbons
  if (!user) {
    return (
      <main className="vx-root vx-login text-foreground">
        <div className="vx-login__stars" aria-hidden="true" />
        <div className="vx-login__ribbon vx-login__ribbon--tl" aria-hidden="true" />
        <div className="vx-login__ribbon vx-login__ribbon--br" aria-hidden="true" />
        <div className="vx-login__floor" aria-hidden="true" />

        {/* Brand: orb + monogram + POSTEL STUDIO wordmark */}
        <div className="vx-login__brand">
          <div className="vx-login__orb">
            <PostelMark size={96} glow title="Postel Studio" />
          </div>
          <PostelLogo showMark={false} fontSize={26} suffix="STUDIO" />
          <p className="text-[11px] text-[var(--text-muted)] tracking-[0.14em] uppercase text-center" style={{ fontFamily: 'var(--font-display)' }}>
            {BRAND.short}
          </p>
        </div>

        <div className="vx-login__card">
          <div className="text-center mb-8 space-y-2">
            <h1 className="text-lg font-semibold text-[var(--text-strong)]" style={{ fontFamily: 'var(--font-display)' }}>
              Postel<span style={{ fontWeight: 300, color: 'var(--violet-300)' }}>OS</span>
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.18em]" style={{ fontFamily: 'var(--font-display)' }}>
              {isSignUp ? 'REGISTER SYSTEM OPERATOR' : 'ENTER OPERATOR CREDENTIALS'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {/* Email input */}
            <Input
              type="email"
              autoComplete="email"
              required
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leadingIcon={<VxIcon name="mail" size={16} />}
              style={{ width: '100%' }}
            />

            {/* Password input */}
            <Input
              type="password"
              autoComplete="current-password"
              required
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leadingIcon={<Lock size={16} style={{ color: 'var(--text-muted)' }} />}
              style={{ width: '100%' }}
            />

            {/* Notifications */}
            {errorMsg && (
              <div className="p-4 rounded-xl border flex items-start space-x-3 text-xs" style={{ background: 'rgba(255,77,109,0.06)', borderColor: 'rgba(255,77,109,0.22)', color: 'var(--danger-300)' }}>
                <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
                <span className="font-mono leading-relaxed">{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-4 rounded-xl border flex items-start space-x-3 text-xs" style={{ background: 'rgba(46,230,160,0.06)', borderColor: 'rgba(46,230,160,0.22)', color: 'var(--signal-400)' }}>
                <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
                <span className="font-mono leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              fullWidth
              size="lg"
              leadingIcon={isSignUp ? <VxIcon name="usercheck" size={16} color="#fff" /> : <VxIcon name="crown" size={16} color="#fff" />}
            >
              {submitting
                ? 'COMMUNICATING WITH CORE...'
                : isSignUp
                  ? 'REGISTER OPERATOR'
                  : 'LOGIN'}
            </Button>
          </form>

          {/* Social logins (Google, Microsoft) temporarily removed — provider setup issues, see SETUP.md §2b */}

          {/* Toggle Login/Signup */}
          {ALLOW_SIGNUP && (<div className="text-center pt-6">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--brand)] transition font-mono border-b border-dashed border-white/10 hover:border-[var(--brand)] pb-0.5 cursor-pointer"
            >
              {isSignUp ? 'Already registered? Login here' : 'Need operator account? Register here'}
            </button>
          </div>)}
        </div>
      </main>
    );
  }

  return (
    <AuthContext.Provider value={{ user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
