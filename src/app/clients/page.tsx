'use client';

import React, { useEffect, useState } from 'react';
import { PageHeaderCard, VxIcon, VeltrixSpinner } from '@/components/ds';
import { db } from '@/lib/db';

interface Client {
  id: string;
  business_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  service_purchased?: string;
  total_value: number;
  monthly_retainer: number;
  status: 'Active' | 'Inactive' | 'Completed';
  created_at: string;
}

const clientCard: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
  transition: 'transform 0.2s ease, border-color 0.2s ease',
  position: 'relative',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--ink-700)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-strong)',
  fontFamily: 'var(--font-body)',
  fontSize: 13.5,
  outline: 'none',
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [servicePurchased, setServicePurchased] = useState('AI Website System');
  const [monthlyRetainer, setMonthlyRetainer] = useState('0');
  const [totalValue, setTotalValue] = useState('1500');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Completed'>('Active');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const data = await db.getClients();
      setClients(data as Client[]);
    } catch (err) {
      console.warn('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setFormError('Business name is required.');
      return;
    }
    setFormError(null);

    try {
      await db.addClient({
        business_name: businessName,
        contact_name: contactName,
        email,
        phone,
        website,
        service_purchased: servicePurchased,
        monthly_retainer: parseFloat(monthlyRetainer) || 0,
        total_value: parseFloat(totalValue) || 0,
        status,
      });

      // Clear Form
      setBusinessName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setWebsite('');
      setMonthlyRetainer('0');
      setTotalValue('1500');
      setStatus('Active');
      setIsModalOpen(false);

      // Refresh List
      await fetchClients();
    } catch (err: any) {
      setFormError(`Failed to save client: ${err.message}`);
    }
  };

  const getStatusColor = (st: Client['status']) => {
    if (st === 'Active') return 'var(--signal-400)';
    if (st === 'Completed') return 'var(--cyan-300)';
    return 'var(--text-dim)';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <VeltrixSpinner message="Accessing CRM database..." />
      </div>
    );
  }

  const activeClients = clients.filter(c => c.status === 'Active');
  const totalRetainers = activeClients.reduce((sum, c) => sum + (c.monthly_retainer || 0), 0);
  const totalBookValue = clients.reduce((sum, c) => sum + (c.total_value || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <PageHeaderCard
        icon="briefcase"
        title="Clients Directory"
        subtitle="Your corporate book of business — service catalogs, active recurring revenue retainers, and client health metrics."
        stats={[
          { value: String(clients.length), label: 'TOTAL CLIENTS', color: 'var(--text-strong)' },
          { value: `$${totalRetainers.toLocaleString()}/mo`, label: 'RECURRING RETAINER', color: 'var(--cyan-300)' },
          { value: `$${(totalBookValue / 1000).toFixed(1)}K`, label: 'TOTAL CONTRACT VALUE', color: 'var(--signal-400)' },
        ]}
        action={
          <div
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 18px',
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'var(--grad-brand)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--glow-violet)',
              whiteSpace: 'nowrap',
            }}
          >
            <VxIcon name="plus" size={15} color="#fff" />
            Add Client
          </div>
        }
      />

      {/* Clients Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        {clients.length > 0 ? (
          clients.map((c) => (
            <div
              key={c.id}
              className="vx-glass hover:border-white/20"
              style={clientCard}
              onClick={() => setSelectedClient(c)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                  CLIENT ID: {c.id.substring(0, 8).toUpperCase()}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--hairline)',
                    color: getStatusColor(c.status),
                  }}
                >
                  {c.status.toUpperCase()}
                </span>
              </div>

              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>
                {c.business_name}
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {c.contact_name ? `Contact: ${c.contact_name}` : 'No primary contact'}
              </p>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: '1px solid var(--hairline)',
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>PRODUCT</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--violet-200)', marginTop: 2 }}>
                    {c.service_purchased || 'Unclassified'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>RETAINER</div>
                  <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--cyan-300)', marginTop: 2 }}>
                    ${c.monthly_retainer || 0}/mo
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: 'var(--space-10) 0',
              color: 'var(--text-dim)',
              fontSize: 13.5,
              fontFamily: 'var(--font-mono)',
            }}
          >
            No clients in your directory. Get proposals accepted or add a client manually.
          </div>
        )}
      </section>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[50] flex items-center justify-center p-6"
        >
          <form
            onSubmit={handleAddClient}
            className="vx-glass max-w-lg w-full p-6 rounded-2xl border border-white/[0.08] space-y-4"
            style={{ background: 'var(--grad-panel)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--hairline)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>
                Register New Client Profile
              </h3>
              <span style={{ cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }} onClick={() => setIsModalOpen(false)}>
                ×
              </span>
            </div>

            {formError && (
              <div style={{ color: 'var(--danger-400)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                ⚠️ {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Business / Company Name *</label>
                <input style={inputStyle} type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Austin Dental Care" required />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Contact Name</label>
                <input style={inputStyle} type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Dr. Jane Smith" />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Website</label>
                <input style={inputStyle} type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="e.g. https://smithdental.com" />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Email</label>
                <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. contact@smithdental.com" />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Phone</label>
                <input style={inputStyle} type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 512-555-0199" />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Service Purchased</label>
                <select style={inputStyle} value={servicePurchased} onChange={(e) => setServicePurchased(e.target.value)}>
                  <option value="AI Website System">AI Website System</option>
                  <option value="AI Receptionist Voice/Chatbot">AI Receptionist Voice/Chatbot</option>
                  <option value="AI Branding Package">AI Branding Package</option>
                  <option value="Custom Autopilot System">Custom Autopilot System</option>
                </select>
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Monthly Retainer ($)</label>
                <input style={inputStyle} type="number" value={monthlyRetainer} onChange={(e) => setMonthlyRetainer(e.target.value)} placeholder="e.g. 250" />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Contract Total Value ($)</label>
                <input style={inputStyle} type="number" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} placeholder="e.g. 1500" />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Status</label>
                <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                height: 42,
                borderRadius: 'var(--radius-md)',
                background: 'var(--grad-brand)',
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                border: 'none',
                boxShadow: 'var(--glow-violet)',
                marginTop: 8,
              }}
            >
              Ratify Client Contract
            </button>
          </form>
        </div>
      )}

      {/* Client Details Modal */}
      {selectedClient && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedClient(null);
          }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[50] flex items-center justify-center p-6"
        >
          <div
            className="vx-glass max-w-md w-full p-6 rounded-2xl border border-white/[0.08]"
            style={{ background: 'var(--grad-panel)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--hairline)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-strong)' }}>
                  {selectedClient.business_name}
                </h3>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  ID: {selectedClient.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                <span style={{ fontSize: 20, color: 'var(--text-muted)' }}>×</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>CONTACT PERSON</div>
                  <div style={{ fontSize: 13, color: 'var(--text-strong)', marginTop: 2 }}>{selectedClient.contact_name || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>WEBSITE</div>
                  <div style={{ fontSize: 13, color: 'var(--text-strong)', marginTop: 2 }}>
                    {selectedClient.website ? (
                      <a href={selectedClient.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan-300)' }}>
                        {selectedClient.website}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>EMAIL</div>
                  <div style={{ fontSize: 13, color: 'var(--text-strong)', marginTop: 2 }}>{selectedClient.email || 'None'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>PHONE</div>
                  <div style={{ fontSize: 13, color: 'var(--text-strong)', marginTop: 2 }}>{selectedClient.phone || 'None'}</div>
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: 'var(--ink-700)', border: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>SERVICE SCOPE</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', marginTop: 2 }}>{selectedClient.service_purchased || 'General'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>RETAINER INCOME</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan-300)', marginTop: 2 }}>${selectedClient.monthly_retainer}/mo</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>TOTAL CONTRACT VALUE</div>
                <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--signal-400)', marginTop: 4 }}>
                  ${selectedClient.total_value.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
