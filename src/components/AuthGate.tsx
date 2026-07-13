'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import LoadingState from './LoadingState';
import { ShieldAlert, Lock, ShieldCheck } from 'lucide-react';
import { AmbientBackground, Input, Button, VxIcon } from './ds';

interface AuthContextType {
  user: any;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signOut: async () => {},
  loading: true
});

export const useAuth = () => useContext(AuthContext);

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
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
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Intercept fetch calls to attach auth token and developer integrations
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      // Avoid intercepting requests to the Supabase API itself to prevent infinite recursion
      const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
      const isLocalApi = url.startsWith('/api/') || url.includes('/api/') || (typeof window !== 'undefined' && url.includes(window.location.origin + '/api/'));
      
      if (isLocalApi) {
        try {
          const { data: { session } } = (await supabase.auth.getSession()) as any;
          const token = session?.access_token;
          
          init = init || {};
          const headers = new Headers(init.headers || {});
          
          if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          
          // Forward developer integration overrides from localStorage
          const localKeys = [
            ['x-github-token', 'vx_github_token'],
            ['x-github-repo', 'vx_github_repo'],
            ['x-gemini-key', 'vx_gemini_key'],
            ['x-claude-key', 'vx_claude_key'],
            ['x-obsidian-path', 'vx_obsidian_path'],
            ['x-scraper-path', 'vx_scraper_path'],
          ];
          
          for (const [header, lsKey] of localKeys) {
            const val = localStorage.getItem(lsKey);
            if (val) {
              headers.set(header, val);
            }
          }
          
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
    } catch (err: any) {
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

  // 2. Auth Screen
  if (!user) {
    return (
      <div className="vx-root min-h-screen text-foreground flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'var(--ink-900)' }}>
        <AmbientBackground />
        
        {/* Glow halo in the background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none rounded-full opacity-40" style={{ background: 'var(--grad-halo)', filter: 'blur(40px)' }} />

        <div className="vx-glass max-w-md w-full p-8 rounded-[28px] relative overflow-hidden z-10" style={{ background: 'var(--grad-panel)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)' }}>
          {/* Top glowing line */}
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[var(--brand)] to-transparent" />

          {/* Logo Brand Header */}
          <div className="flex flex-col items-center space-y-4 text-center mb-8">
            <div className="flex items-center space-x-3">
              <span className="text-xl font-bold tracking-widest text-[var(--text-strong)]" style={{ fontFamily: 'var(--font-display)' }}>VELTRIX</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[var(--border-default)] border border-[var(--border-strong)] text-[var(--brand)] uppercase font-bold tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                COMMAND OS
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.18em]" style={{ fontFamily: 'var(--font-display)' }}>
              {isSignUp ? 'REGISTER SYSTEM OPERATOR' : 'ENTER OPERATOR CREDENTIALS'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {/* Email input */}
            <Input
              type="email"
              required
              label="Email Address"
              placeholder="operator@veltrix.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leadingIcon={<VxIcon name="mail" size={16} />}
              style={{ width: '100%' }}
            />

            {/* Password input */}
            <Input
              type="password"
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
                  : 'AUTHORIZE ACCESS'}
            </Button>
          </form>

          {/* Social Logins */}
          {!isSignUp && (
            <div className="space-y-4 mt-6">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-3 text-[9px] text-[var(--text-muted)] font-mono tracking-widest uppercase">OR AUTHORIZE WITH</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  type="button"
                  onClick={async () => {
                    setErrorMsg('');
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: window.location.origin },
                      });
                      if (error) throw error;
                    } catch (err: any) {
                      setErrorMsg(err.message || 'Google authentication failed.');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-strong)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="hover:bg-white/5"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  GOOGLE
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setErrorMsg('');
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'azure',
                        options: { redirectTo: window.location.origin },
                      });
                      if (error) throw error;
                    } catch (err: any) {
                      setErrorMsg(err.message || 'Microsoft authentication failed.');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-strong)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="hover:bg-white/5"
                >
                  <svg width="13" height="13" viewBox="0 0 23 23" fill="currentColor">
                    <rect x="0" y="0" width="11" height="11" fill="#F25022" />
                    <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
                    <rect x="0" y="12" width="11" height="11" fill="#00A4EF" />
                    <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
                  </svg>
                  MICROSOFT
                </button>
              </div>
            </div>
          )}

          {/* Toggle Login/Signup */}
          <div className="text-center pt-6">
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
