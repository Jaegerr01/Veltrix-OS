'use client';

import React, { useEffect, useState } from 'react';
import { PageHeaderCard, VxIcon, VeltrixSpinner } from '@/components/ds';
import { db } from '@/lib/db';

interface Client {
  id: string;
  business_name: string;
}

interface Project {
  id: string;
  client_id: string;
  project_name: string;
  service_type: string;
  status: 'Discovery' | 'Requirements' | 'Design' | 'Development' | 'Review' | 'Revision' | 'Delivered' | 'Completed';
  deadline?: string;
  requirements?: string;
  deliverables: string[];
  revision_count: number;
  notes?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  related_client_id?: string;
}

const projCardStyle: React.CSSProperties = {
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--grad-panel)',
  border: '1px solid var(--border-default)',
  boxShadow: 'var(--shadow-lg), var(--sheen-top)',
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [projectName, setProjectName] = useState('');
  const [clientId, setClientId] = useState('');
  const [serviceType, setServiceType] = useState('Website Development');
  const [status, setStatus] = useState<Project['status']>('Discovery');
  const [deadline, setDeadline] = useState('');
  const [deliverablesStr, setDeliverablesStr] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const pData = await db.getProjects();
      setProjects(pData as Project[]);

      const cData = await db.getClients();
      setClients(cData as Client[]);

      const tData = await db.getTasks();
      setTasks(tData as Task[]);

      if (cData.length > 0) {
        setClientId(cData[0].id);
      }
    } catch (err) {
      console.warn('Failed to load project database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getClientName = (cid: string) => {
    const c = clients.find((c) => c.id === cid);
    return c ? c.business_name : 'Unknown Client';
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !clientId) {
      setFormError('Project name and Client are required.');
      return;
    }
    setFormError(null);

    const deliverables = deliverablesStr
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    try {
      const newProj = await db.addProject({
        client_id: clientId,
        project_name: projectName,
        service_type: serviceType,
        status,
        deadline,
        requirements: '',
        deliverables,
        revision_count: 0,
        notes,
      });

      // Write deliverables as tasks
      for (const item of deliverables) {
        await db.addTask({
          agent_name: 'Delivery Manager Agent',
          title: `[${newProj.project_name}] ${item}`,
          description: `Project milestone checklist task for ${getClientName(clientId)}.`,
          priority: 'Medium',
          status: 'Pending',
          due_date: deadline,
          related_client_id: clientId,
        });
      }

      setProjectName('');
      setDeliverablesStr('');
      setNotes('');
      setDeadline('');
      setIsModalOpen(false);

      // Refresh
      await fetchData();
    } catch (err: any) {
      setFormError(`Failed to save project: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Project['status']) => {
    try {
      await db.updateProject(id, { status: newStatus });
      const pData = await db.getProjects();
      setProjects(pData as Project[]);
    } catch (err) {
      console.warn('Failed to update project status:', err);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    try {
      const targetStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
      await db.updateTask(taskId, { status: targetStatus });
      const tData = await db.getTasks();
      setTasks(tData as Task[]);
    } catch (err) {
      console.warn('Failed to update deliverable task:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <VeltrixSpinner message="Connecting to Delivery Manager..." />
      </div>
    );
  }

  const activeProjects = projects.filter((p) => p.status !== 'Completed');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <PageHeaderCard
        icon="folder"
        title="Delivery Operations"
        subtitle="Manage active customer implementations, deadlines, and milestone roadmap checklists."
        stats={[
          { value: String(projects.length), label: 'TOTAL PROJECTS', color: 'var(--text-strong)' },
          { value: String(activeProjects.length), label: 'ACTIVE BUILDS', color: 'var(--cyan-300)' },
          { value: String(projects.filter((p) => p.status === 'Completed').length), label: 'COMPLETED DELIVERIES', color: 'var(--signal-400)' },
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
            New Project
          </div>
        }
      />

      {/* Projects Timeline Feed */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {projects.length > 0 ? (
          projects.map((proj) => {
            const clientTasks = tasks.filter((t) => t.related_client_id === proj.client_id && t.title.includes(`[${proj.project_name}]`));
            const completedTasks = clientTasks.filter((t) => t.status === 'Completed');
            const progressPct = clientTasks.length > 0 ? Math.round((completedTasks.length / clientTasks.length) * 100) : 0;

            return (
              <div key={proj.id} className="vx-glass" style={projCardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: 9.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                      {proj.service_type.toUpperCase()}
                    </span>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', marginTop: 4 }}>
                      {proj.project_name}
                    </h4>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Client: <span style={{ color: 'var(--violet-200)' }}>{getClientName(proj.client_id)}</span>
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Status Select */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>WORKFLOW STATE</span>
                      <select
                        value={proj.status}
                        onChange={(e) => handleUpdateStatus(proj.id, e.target.value as any)}
                        style={{
                          height: 32,
                          padding: '0 8px',
                          borderRadius: 6,
                          background: 'var(--ink-700)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-strong)',
                          fontSize: 12.5,
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="Discovery">Discovery</option>
                        <option value="Requirements">Requirements</option>
                        <option value="Design">Design</option>
                        <option value="Development">Development</option>
                        <option value="Review">Review</option>
                        <option value="Revision">Revision</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    {/* Deadline */}
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>DEADLINE</span>
                      <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--warn-400)', marginTop: 4 }}>
                        {proj.deadline || 'No target date'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>ROADMAP COMPLETION</span>
                    <span style={{ color: 'var(--cyan-300)' }}>{progressPct}%</span>
                  </div>
                  <div style={{ height: 4, width: '100%', borderRadius: 99, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${progressPct}%`,
                        background: 'linear-gradient(90deg, var(--violet-400), var(--cyan-400))',
                        boxShadow: 'var(--glow-soft)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Milestone Checklist */}
                {clientTasks.length > 0 && (
                  <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--hairline)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', marginBottom: 10 }}>
                      MILESTONES & DELIVERABLES CHECKLIST
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {clientTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => handleToggleTask(t.id, t.status)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: 'pointer',
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: t.status === 'Completed' ? 'rgba(46,230,160,0.03)' : 'rgba(255,255,255,0.01)',
                            border: '1px solid var(--hairline)',
                            transition: 'background 0.2s ease',
                          }}
                        >
                          <VxIcon
                            name={t.status === 'Completed' ? 'check' : 'target'}
                            size={14}
                            color={t.status === 'Completed' ? 'var(--signal-400)' : 'var(--text-dim)'}
                          />
                          <span
                            style={{
                              fontSize: 12.5,
                              color: t.status === 'Completed' ? 'var(--text-dim)' : 'var(--text-body)',
                              textDecoration: t.status === 'Completed' ? 'line-through' : 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {t.title.replace(`[${proj.project_name}] `, '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {proj.notes && (
                  <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                    Notes: {proj.notes}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-10) 0', color: 'var(--text-dim)', fontSize: 13.5, fontFamily: 'var(--font-mono)' }}>
            No projects in delivery timeline. Link accepted proposals or register projects manually.
          </div>
        )}
      </section>

      {/* New Project Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[50] flex items-center justify-center p-6"
        >
          <form
            onSubmit={handleCreateProject}
            className="vx-glass max-w-md w-full p-6 rounded-2xl border border-white/[0.08] space-y-4"
            style={{ background: 'var(--grad-panel)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--hairline)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>
                Initialize New Implementation Project
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Project Scope Name *</label>
                <input style={inputStyle} type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Chatbot Onboarding Implementation" required />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Assign Customer (Client) *</label>
                <select style={inputStyle} value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                  {clients.length > 0 ? (
                    clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.business_name}
                      </option>
                    ))
                  ) : (
                    <option value="">No clients configured</option>
                  )}
                </select>
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Service Category</label>
                <select style={inputStyle} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                  <option value="Website Development">Website Development</option>
                  <option value="AI Receptionist">AI Receptionist</option>
                  <option value="Branding">Branding</option>
                  <option value="Custom Autopilot Flow">Custom Autopilot Flow</option>
                </select>
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Delivery Deadline</label>
                <input style={inputStyle} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Roadmap Milestones (one per line)</label>
                <textarea
                  value={deliverablesStr}
                  onChange={(e) => setDeliverablesStr(e.target.value)}
                  placeholder="e.g.&#10;Setup FAQs database&#10;Integrate voice synthesis API&#10;Conduct test dials&#10;Deliver system handover"
                  style={{
                    width: '100%',
                    minHeight: 80,
                    padding: 10,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--ink-700)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-strong)',
                    fontSize: 13,
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Project Notes</label>
                <input style={inputStyle} type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special delivery briefs..." />
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
              Deploy Project Roadmap
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
