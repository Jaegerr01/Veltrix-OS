'use client';

import { useState } from 'react';

interface Props {
  onClose: () => void;
  onLeadAdded: () => void;
}

export default function AddLeadForm({ onClose, onLeadAdded }: Props) {
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [location, setLocation] = useState('');
  const [painPoint, setPainPoint] = useState('');
  const [source, setSource] = useState('Cold Research');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          contact_name: contactName || null,
          industry: industry || null,
          website: website || null,
          email: email || null,
          phone: phone || null,
          social_link: socialLink || null,
          location: location || null,
          pain_point: painPoint || null,
          lead_score: 0.0,
          status: 'New',
          source,
          notes: notes || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onLeadAdded();
        onClose();
      } else {
        alert('Failed to add lead: ' + json.error);
      }
    } catch (err: any) {
      console.warn('Error adding lead:', err);
      alert('Error adding lead: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cyber-bg/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel p-6 border border-neon-cyan/40 rounded-xl bg-cyber-bg/95 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(6,182,212,0.25)] space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h4 className="text-sm font-mono font-bold text-neon-cyan uppercase tracking-wider">
            Add a Potential Client (Lead)
          </h4>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-neon-pink font-mono text-xs cursor-pointer"
          >
            [CLOSE]
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              placeholder="Radiant Smiles Dental Clinic"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Contact Person Name</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              placeholder="e.g. Dr. Sarah Jenkins"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              placeholder="Dental"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Website URL</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              placeholder="http://example.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Contact Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              placeholder="info@radiant.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              placeholder="555-0120"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Social URL (IG/LinkedIn)</label>
            <input
              type="text"
              value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              placeholder="instagram.com/radiant"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Physical Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
              placeholder="Austin, TX"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">How we found them</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition font-mono"
            >
              <option value="Cold Research">Cold Research</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Instagram">Instagram DM</option>
              <option value="Inbound">Inbound Site Request</option>
              <option value="Referral">Client Referral</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Problems we noticed (Pain Points)</label>
            <textarea
              value={painPoint}
              onChange={(e) => setPainPoint(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-foreground focus:outline-none focus:border-neon-cyan transition"
              placeholder="e.g. Website is slow, no online booking form, no chat assistants..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Administrative Notes / Context</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-foreground focus:outline-none focus:border-neon-cyan transition"
              placeholder="e.g. Key decision maker is Sarah. Spoke briefly on IG, highly interested in automation."
            />
          </div>
          <div className="md:col-span-2 flex justify-end space-x-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 rounded text-muted-foreground hover:bg-white/5 transition cursor-pointer font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/80 text-black rounded font-mono font-bold transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'SAVING...' : 'SAVE LEAD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
