'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PageHeaderCard,
  VxIcon,
  Skeleton,
  SkeletonCard,
  SkeletonRegion,
  
  Modal,
  Input,
  Textarea,
  Select,
  Button,
  type SelectOption,
  EmptyState,
} from '@/components/ds';
import { useToast } from '@/components/Toast';
import { db } from '@/lib/db';
import { asErr } from '@/lib/errors';
import { clickable } from '@/lib/a11y';

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

const OWNER_OPTIONS: SelectOption[] = [
  { value: 'Lead Gen AI', label: 'Lead Gen AI' },
  { value: 'Outreach AI', label: 'Outreach AI' },
  { value: 'Appt Setter', label: 'Appointment Setter' },
  { value: 'Delivery Manager Agent', label: 'Delivery Manager' },
  { value: 'General Operator', label: 'Me' },
];

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

/* Plain labels. The stored values keep the original status strings the rest of
   the app and the database expect. */
const STATUS_OPTIONS: SelectOption[] = [
  { value: 'Pending', label: 'To do' },
  { value: 'In Progress', label: 'In progress' },
  { value: 'Needs Approval', label: 'Needs review' },
  { value: 'Blocked', label: 'Blocked' },
];

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
  const [saving, setSaving] = useState(false);
  const toast = useToast();

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
    const t = setTimeout(() => { void fetchTasks(); }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      // Validation belongs next to the field that is wrong, not in a toast.
      setFormError('Give the task a name.');
      return;
    }
    setFormError(null);
    // Guards against a double submit creating two tasks.
    if (saving) return;
    setSaving(true);

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
      toast.success('Task added');
    } catch (errRaw: unknown) { const err = asErr(errRaw);
      // A save failure is about the request, not one field — and since
      // safeWrite stopped fabricating success, this now actually fires.
      toast.error("Couldn't add the task", 'Check your connection and try again.');
      console.error('addTask failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Task['status']) => {
    try {
      await db.updateTask(id, { status: newStatus });
      await fetchTasks();
    } catch (err) {
      toast.error("Couldn't move the task", 'Your change was not saved.');
      console.error('updateTask failed:', err);
    }
  };

  if (loading) {
    // Skeletons in the shape of the board, so the layout does not jump when the
    // real columns arrive — and one announcement rather than four.
    return (
      <SkeletonRegion label="Loading tasks">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-5)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Skeleton height={12} width="45%" />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ))}
        </div>
      </SkeletonRegion>
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
            {...clickable(() => setIsModalOpen(true))}
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
      <section className="vx-kanban" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-5)', alignItems: 'start' }}>
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
                <EmptyState compact icon="clipboard" title="No tasks here" body="Ask the CEO for a plan and tasks land in this board." action={<Link href="/ceo" className="vx-linkbtn">Open CEO Console</Link>} />
              )}
            </div>
          </div>
        ))}
      </section>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add task"
        description="Tasks show up on the board straight away."
        onSubmit={handleCreateTask}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Adding…' : 'Add task'}
            </Button>
          </>
        }
      >
        <Input
          label="Task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Schedule chatbot demo"
          error={formError ?? undefined}
          required
        />

        <Textarea
          label="Details"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Anything the owner needs to know."
          rows={3}
        />

        <Select
          label="Owner"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          options={OWNER_OPTIONS}
        />

        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Task['priority'])}
          options={PRIORITY_OPTIONS}
        />

        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Task['status'])}
          options={STATUS_OPTIONS}
        />

        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </Modal>
    </div>
  );
}
