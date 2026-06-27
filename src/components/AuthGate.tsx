'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import LoadingState from './LoadingState';
import { ShieldAlert, Key, Mail, Lock, ShieldCheck, UserCheck } from 'lucide-react';

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

    // Intercept fetch calls to attach auth token
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      // Avoid intercepting requests to the Supabase API itself to prevent infinite recursion
      const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
      const isLocalApi = url.startsWith('/api/') || url.includes('/api/') || (typeof window !== 'undefined' && url.includes(window.location.origin + '/api/'));
      
      if (isLocalApi) {
        try {
          const { data: { session } } = (await supabase.auth.getSession()) as any;
          const token = session?.access_token;
          
          if (token) {
            init = init || {};
            const headers = new Headers(init.headers || {});
            if (!headers.has('Authorization')) {
              headers.set('Authorization', `Bearer ${token}`);
            }
            init.headers = headers;
          }
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
      <div className="min-h-screen bg-cyber-bg text-foreground flex items-center justify-center p-6 font-mono selection:bg-neon-pink selection:text-black">
        <div className="max-w-md w-full glass-panel border border-neon-orange/30 p-8 rounded-xl shadow-[0_0_50px_rgba(249,115,22,0.1)] space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon-orange via-transparent to-neon-orange" />
          <div className="flex justify-center text-neon-orange">
            <ShieldAlert size={48} className="animate-pulse" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neon-orange">DB Config Offline</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Supabase parameters are missing or undefined. This system requires database connection keys to start up.
            </p>
          </div>
          <div className="p-4 bg-white/2 border border-white/5 rounded text-[11px] text-muted-foreground space-y-2">
            <div>Ensure your <code className="text-foreground">.env.local</code> contains:</div>
            <pre className="text-[10px] text-neon-cyan overflow-x-auto select-all p-2 bg-black/40 rounded">
{`NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
          </div>
          <div className="text-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-neon-orange/30 text-neon-orange hover:bg-neon-orange/10 rounded text-xs transition cursor-pointer font-bold"
            >
              RECHECK CONNECTION
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Auth Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-cyber-bg text-foreground flex items-center justify-center p-6 font-mono select-none">
        <div className="max-w-md w-full glass-panel border border-neon-purple/30 p-8 rounded-xl shadow-[0_0_50px_rgba(168,85,247,0.12)] space-y-6 relative overflow-hidden">
          {/* Decorative neon borders */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-purple" />
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-neon-purple/10 rounded-full blur-xl" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-neon-cyan/10 rounded-full blur-xl" />

          {/* Logo Brand Header */}
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="flex items-center space-x-2.5">
              <span className="text-lg font-bold tracking-widest text-foreground">VELTRIX</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-purple/20 border border-neon-purple/30 text-neon-purple uppercase font-bold tracking-widest">
                OS
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {isSignUp ? 'REGISTER SYSTEM OPERATOR' : 'ENTER OPERATOR CREDENTIALS'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 text-xs font-sans">
            {/* Email input */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase block">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="operator@veltrix.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded pl-9 pr-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase block">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded pl-9 pr-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                />
              </div>
            </div>

            {/* Notifications */}
            {errorMsg && (
              <div className="p-3 bg-neon-pink/10 border border-neon-pink/30 text-neon-pink rounded text-xs flex items-start space-x-2 font-mono">
                <ShieldAlert size={14} className="mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded text-xs flex items-start space-x-2 font-mono">
                <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2.5 rounded font-mono font-bold text-xs uppercase flex items-center justify-center space-x-2 transition cursor-pointer select-none ${
                isSignUp
                  ? 'bg-neon-purple hover:bg-neon-purple/80 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-neon-cyan hover:bg-neon-cyan/80 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              }`}
            >
              {isSignUp ? <UserCheck size={14} /> : <Key size={14} />}
              <span>
                {submitting
                  ? 'COMMUNICATING WITH CORE...'
                  : isSignUp
                    ? 'REGISTER OPERATOR'
                    : 'AUTHORIZE ACCESS'}
              </span>
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-[11px] text-muted-foreground hover:text-neon-cyan transition font-mono border-b border-dashed border-white/10 hover:border-neon-cyan/50 pb-0.5"
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
