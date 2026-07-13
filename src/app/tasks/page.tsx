'use client';

import React, { useEffect, useState } from 'react';
import { PageHeaderCard, VxIcon, VeltrixSpinner } from '@/components/ds';
import { db } from '@/lib/db';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked' | 'Needs Approval';
  due_date?: string;
  agent_name: string;
  created_at: string;
}

const PR_COLOR: Record<Task['priority'], string> = {
  Critical: 'var(--danger-400)',
  High: 'var(--danger-400)',
  Medium: 'var(--warn-400)',
  Low: 'var(--mist-400)',
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [status, setStatus] = useState<Task['status']>('Pending');
  const [dueDate, setDueDate] = useState('');
  const [agentName, setAgentName] = useState('General Operator');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const data = await db.getTasks();
      setTasks(data as Task[]);
    } catch (err) {
      console.warn('Failed to load tasks database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Task title is required.');
      return;
    }
    setFormError(null);

    try {
      await db.addTask({
        title,
        description,
        priority,
        status,
        due_date: dueDate || undefined,
        agent_name: agentName,
      });

      // Clear Form
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus('Pending');
      setDueDate('');
      setAgentName('General Operator');
      setIsModalOpen(false);

      // Refresh
      await fetchTasks();
    } catch (err: any) {
      setFormError(`Failed to save task: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Task['status']) => {
    try {
      await db.updateTask(id, { status: newStatus });
      await fetchTasks();
    } catch (err) {
      console.warn('Failed to update task status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <VeltrixSpinner message="Synchronizing agent queues..." />
      </div>
    );
  }

  // Kanban groupings
  const todo = tasks.filter((t) => t.status === 'Pending');
  const inProgress = tasks.filter((t) => t.status === 'In Progress');
  const review = tasks.filter((t) => ['Needs Approval', 'Blocked'].includes(t.status));
  const completed = tasks.filter((t) => t.status === 'Completed');

  const columns = [
    { name: 'To-Do', tone: 'var(--cyan-400)', tasks: todo, key: 'Pending' as const },
    { name: 'Working On', tone: 'var(--violet-300)', tasks: inProgress, key: 'In Progress' as const },
    { name: 'Needs Review', tone: 'var(--warn-400)', tasks: review, key: 'Needs Approval' as const },
    { name: 'Completed', tone: 'var(--signal-400)', tasks: completed, key: 'Completed' as const },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <PageHeaderCard
        icon="usercheck"
        title="Tasks Kanban"
        subtitle="Everything your AI specialists and you have committed to — qualify, process, complete, and verify actions."
        stats={[
          { value: String(todo.length + inProgress.length + review.length), label: 'OPEN TASKS', color: 'var(--warn-400)' },
          { value: String(completed.length), label: 'COMPLETED ACTIONS', color: 'var(--signal-400)' },
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
            New Task
          </div>
        }
      />

      {/* Kanban Board Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-5)', alignItems: 'start' }}>
        {columns.map((col) => (
          <div
            key={col.name}
            className="vx-glass"
            style={{
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--grad-panel)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-md), var(--sheen-top)',
              minHeight: 360,
            }}
          >
            {/* Column Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--hairline)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.tone, boxShadow: `0 0 8px ${col.tone}` }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: 'var(--ls-wide)', textTransform: 'uppercase', color: 'var(--text-body)' }}>
                  {col.name}
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', padding: '2px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--hairline)' }}>
                {col.tasks.length}
              </span>
            </div>

            {/* Task list inside column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {col.tasks.length > 0 ? (
                col.tasks.map((tk) => (
                  <div
                    key={tk.id}
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--ink-700)',
                      border: '1px solid var(--hairline)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: PR_COLOR[tk.priority],
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--hairline)',
                        }}
                      >
                        {tk.priority}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 9.5, fontWeight: 600, color: 'var(--text-dim)' }}>
                        {tk.agent_name.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.4 }}>
                      {tk.title}
                    </div>

                    {tk.description && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                        {tk.description}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--hairline)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-dim)' }}>
                        {tk.due_date || 'No deadline'}
                      </span>

                      {/* State transitions */}
                      <div style={{ display: 'flex', gap: 4 }}>
                        {tk.status !== 'Pending' && (
                          <button
                            onClick={() => handleUpdateStatus(tk.id, 'Pending')}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}
                            title="Move to To-Do"
                          >
                            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>←</span>
                          </button>
                        )}
                        {tk.status !== 'Completed' && (
                          <button
                            onClick={() => handleUpdateStatus(tk.id, tk.status === 'Pending' ? 'In Progress' : 'Completed')}
                            style={{
                              background: 'rgba(46,230,160,0.1)',
                              border: '1px solid rgba(46,230,160,0.2)',
                              color: 'var(--signal-400)',
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          >
                            {tk.status === 'Pending' ? 'Start' : 'Complete'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  No tasks in this list
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* New Task Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[50] flex items-center justify-center p-6"
        >
          <form
            onSubmit={handleCreateTask}
            className="vx-glass max-w-md w-full p-6 rounded-2xl border border-white/[0.08] space-y-4"
            style={{ background: 'var(--grad-panel)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--hairline)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>
                Allocate New Workflow Task
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
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Task Action Title *</label>
                <input style={inputStyle} type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Schedule chatbot demonstration" required />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Description / Scope</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about task execution requirements..."
                  style={{
                    width: '100%',
                    minHeight: 60,
                    padding: 10,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--ink-700)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-strong)',
                    fontSize: 13,
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Responsible Agent Owner</label>
                <select style={inputStyle} value={agentName} onChange={(e) => setAgentName(e.target.value)}>
                  <option value="Lead Gen AI">Lead Gen AI</option>
                  <option value="Outreach AI">Outreach AI</option>
                  <option value="Appt Setter">Appt Setter</option>
                  <option value="Delivery Manager Agent">Delivery Manager Agent</option>
                  <option value="General Operator">General Operator</option>
                </select>
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Target Priority</label>
                <select style={inputStyle} value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Workflow State</label>
                <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="Pending">To-Do (Pending)</option>
                  <option value="In Progress">Working On (In Progress)</option>
                  <option value="Needs Approval">Needs Review (Needs Approval)</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
              <div>
                <label className="vx-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Due Date</label>
                <input style={inputStyle} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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
              Commit Task
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
