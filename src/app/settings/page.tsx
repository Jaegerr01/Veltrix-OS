'use client';

import React from 'react';
import { Button, Input, Skeleton, Switch, VxIcon, useAppearance } from '@/components/ds';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { db } from '@/lib/db';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/components/AuthGate';
import { SUPPORT_EMAIL } from '@/lib/brand';
import { EmailPanel, AiConnectionPanel } from '@/components/SystemConnections';
import { asErr } from '@/lib/errors';

const settingsCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
};

const PRESETS: Record<string, { name: string; swatch: string; accent: string }> = {
  violet: { name: 'Postel Violet', swatch: 'linear-gradient(135deg,#8B5CF6,#B02FE0)', accent: '#8B5CF6' },
  cyan: { name: 'Cyan', swatch: 'linear-gradient(135deg,#22D3EE,#8B5CF6)', accent: '#22D3EE' },
  emerald: { name: 'Emerald', swatch: 'linear-gradient(135deg,#2EE6A0,#22D3EE)', accent: '#2EE6A0' },
  magenta: { name: 'Neon Orchid', swatch: 'linear-gradient(135deg,#C026D3,#8B5CF6)', accent: '#C026D3' },
};

const PREF_DEFS = [
  { key: 'desktop', name: 'Desktop Notifications', desc: 'Alerts for agent events & deals' },
  { key: 'voice', name: 'Voice Commands', desc: 'ARIA voice assistant (push-to-talk / hands-free toggle)' },
  { key: 'autopilot', name: 'Autopilot drafting', desc: 'Agents draft and queue work on their own. Emails still wait for your approval.' },
  { key: 'weekly', name: 'Weekly Reports', desc: 'Emailed performance summary' },
] as const;

export default function SettingsPage() {
  const {
    theme,
    accentColor,
    backgroundColor,
    avatar,
    setTheme,
    setAccentColor,
    setBackgroundColor,
    setAvatar,
  } = useAppearance();

  const toast = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [displayName, setDisplayName] = React.useState('Operator');
  const [workspaceName, setWorkspaceName] = React.useState('PostelOS HQ');
  const [prefs, setPrefs] = React.useState<Record<string, boolean>>({
    desktop: true,
    voice: true,
    autopilot: false,
    weekly: true,
  });

  // Developer Integrations state (paths only - API keys/tokens live in server env vars, never in the browser)
  const [scraperPath, setScraperPath] = React.useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load configuration on mount
  React.useEffect(() => {
    async function loadSettings() {
      try {
        const profile = await db.getBusinessProfile();
        if (profile) {
          setWorkspaceName(profile.business_name || 'PostelOS HQ');
          setPrefs((prev) => ({
            ...prev,
            autopilot: !!profile.autopilot,
          }));
        }
      } catch (err) {
        console.warn('Failed to load profile settings:', err);
      }

      const savedName = localStorage.getItem('vx_display_name') || 'Operator';
      setDisplayName(savedName);

      const savedPrefs = localStorage.getItem('vx_preferences');
      if (savedPrefs) {
        try {
          setPrefs((prev) => ({
            ...prev,
            ...JSON.parse(savedPrefs),
          }));
        } catch {}
      }

      // Purge secrets older versions stored in the browser.
      ['vx_claude_key', 'vx_gemini_key', 'vx_github_token'].forEach((k) => localStorage.removeItem(k));
      // The external vault integration was removed (PostelOS has a built-in Memory Vault); purge its old keys.
      ['vx_github_repo', 'vx_obsidian_path'].forEach((k) => localStorage.removeItem(k));
      setScraperPath(localStorage.getItem('vx_scraper_path') || '');

      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image too large', 'Please select an image smaller than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        toast.success('Photo Uploaded', 'Avatar preview updated. Click Save to persist.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Persist workspace name and autopilot direct to Supabase
      await db.updateBusinessProfile({
        business_name: workspaceName,
        autopilot: prefs.autopilot,
      });

      // Persist displayName and prefs to localStorage
      localStorage.setItem('vx_display_name', displayName);
      localStorage.setItem('vx_preferences', JSON.stringify(prefs));

      // Persist developer integrations
      localStorage.setItem('vx_scraper_path', scraperPath);

      toast.success('Settings Saved', 'System profile and visual preferences updated successfully.');
    } catch (errRaw: unknown) { const err = asErr(errRaw);
      toast.error('Save Failed', err.message || 'Could not save profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const triggerDecommission = async () => {
    const confirm = await toast.confirm(
      'Decommission Workspace?',
      'This will permanently shut down all active agents and archive telemetry. This action is irreversible.'
    );
    if (confirm) {
      toast.info('Not available', 'Decommission is not implemented, so nothing was changed. To pause outbound email set OUTREACH_SEND_ENABLED=false.');
    }
  };

  if (loading) {
    return (
      <div className="vx-stack" role="status" aria-label="Loading settings">
        <Skeleton width={260} height={30} />
        <Skeleton height={220} />
        <Skeleton height={220} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
      <OnboardingChecklist variant="health" />

      {/* Dynamic page card */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-10)', alignItems: 'stretch', maxWidth: 1200 }}>
        {/* Operator Profile */}
        <div style={settingsCard} className="vx-glass flex flex-col gap-6">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>Operator Profile</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'relative',
                width: 88,
                height: 88,
                flex: '0 0 auto',
                borderRadius: '50%',
                boxShadow: 'var(--glow-violet)',
                border: '2px solid var(--border-default)',
                cursor: 'pointer',
                overflow: 'hidden'
              }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--ink-600)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', alignContent: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-display)', fontSize: 11 }}>Photo</div>
              )}
              <span style={{ position: 'absolute', right: 0, bottom: 0, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'var(--grad-brand)', border: '2px solid var(--ink-800)', boxShadow: 'var(--glow-violet)' }}>
                <VxIcon name="camera" size={12} color="#fff" />
              </span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
            
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text-strong)' }}>{displayName}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email ?? SUPPORT_EMAIL}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 8 }}>Drop or click the avatar to change your photo.</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              size="md"
              style={{ width: '100%' }}
            />
            <Input
              label="Workspace Title"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              size="md"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Preferences */}
        <div style={settingsCard} className="vx-glass flex flex-col justify-between gap-6">
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 'var(--space-4)' }}>Preferences</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {PREF_DEFS.map((p, i) => (
                <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: '14px 0', borderBottom: i < PREF_DEFS.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.desc}</div>
                  </div>
                  <Switch ariaLabel={p.name} checked={prefs[p.key]} onChange={(v) => setPrefs((s) => ({ ...s, [p.key]: v }))} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.22)' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--danger-400)' }}>Decommission Workspace</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Permanently shut down all agents.</div>
            </div>
            <Button variant="danger" size="sm" onClick={triggerDecommission}>Decommission</Button>
          </div>
        </div>

        {/* Developer Integrations */}
        <div style={settingsCard} className="vx-glass flex flex-col gap-6">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>Developer Integrations</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              API keys and tokens (GEMINI_API_KEY, email credentials) are server environment variables - set them in
              <code> .env.local </code> or Netlify, not here. They are intentionally not stored in the browser.
            </div>
            <Input
              label="Local Maps Scraper Script Path"
              value={scraperPath}
              onChange={(e) => setScraperPath(e.target.value)}
              placeholder="C:\Users\H.H\.local\bin\veltrix_maps_scraper.py"
              size="md"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <AiConnectionPanel />

        <EmailPanel />

        {/* Appearance & Theme (Accent Palette & Background Color) */}
        <div style={{ ...settingsCard, gridColumn: '1 / -1' }} className="vx-glass flex flex-col gap-6">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>Appearance &amp; Theme</h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Customize the visual command environment</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
            {/* Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)' }}>Accent Presets</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
                {Object.keys(PRESETS).map((k) => {
                  const t = PRESETS[k];
                  const active = theme === k;
                  return (
                    <div
                      key={k}
                      onClick={() => setTheme(k)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        cursor: 'pointer',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        background: active ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.01)',
                        border: `1px solid ${active ? 'var(--brand)' : 'var(--border-default)'}`,
                        boxShadow: active ? `0 0 16px var(--brand)33` : 'none',
                        transition: 'all var(--dur-base) var(--ease-out)',
                      }}
                    >
                      <span style={{ height: 28, borderRadius: 'var(--radius-xs)', background: t.swatch, boxShadow: active ? `0 0 12px ${t.accent}44` : 'none' }} />
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: 'var(--text-strong)', textAlign: 'center' }}>{t.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Accent Color Wheel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)' }}>Custom Accent</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-default)' }}>
                <input
                  type="color"
                  aria-label="Custom accent color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{
                    width: 42,
                    height: 42,
                    padding: 0,
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Hex Color</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{accentColor.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Custom Background Color Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="vx-eyebrow" style={{ color: 'var(--text-muted)' }}>Background Canvas</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-default)' }}>
                <input
                  type="color"
                  aria-label="Background canvas color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  style={{
                    width: 42,
                    height: 42,
                    padding: 0,
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Canvas Hex</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{backgroundColor.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Save Settings footer bar */}
      <div className="flex justify-end p-4 rounded-xl" style={{ borderTop: '1px solid var(--border-default)' }}>
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          size="lg"
          leadingIcon={saving ? <VxIcon name="refresh" size={16} style={{ animation: 'vxRingSpin 2s linear infinite' }} /> : <VxIcon name="check" size={16} />}
        >
          {saving ? 'SAVING CONFIGURATION...' : 'SAVE SETTINGS'}
        </Button>
      </div>
    </div>
  );
}
