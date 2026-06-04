'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Task, Goal } from '@/lib/types';
import TaskBoard from '@/components/TaskBoard';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import { CheckSquare, Plus } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<any>('Medium');
  const [agentName, setAgentName] = useState('CEO Agent');
  const [goalId, setGoalId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      const tks = await db.getTasks();
      const gls = await db.getGoals();
      setTasks(tks);
      setGoals(gls);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      // Determine completion comments
      const patch: Partial<Task> = { status: newStatus };
      if (newStatus === 'Completed') {
        patch.result = 'Marked as completed manually.';
      }
      await db.updateTask(taskId, patch);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      const deleted = await db.deleteTask(taskId);
      if (deleted) loadData();
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || submitting) return;

    setSubmitting(true);
    try {
      await db.addTask({
        agent_name: agentName,
        title,
        description: description || undefined,
        priority,
        status: 'Pending',
        due_date: dueDate || undefined,
        related_goal_id: goalId || undefined
      });

      // Reset & Reload
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setAgentName('CEO Agent');
      setGoalId('');
      setDueDate('');
      setShowAddForm(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="LOADING TO-DO LIST..." />;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 text-neon-purple">
          <CheckSquare size={20} />
          <span className="font-mono text-sm font-bold uppercase tracking-wider">To-Do Checklist</span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-neon-purple hover:bg-neon-purple/80 text-white rounded text-xs font-mono font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)]"
        >
          <Plus size={14} />
          <span>{showAddForm ? 'HIDE FORM' : 'CREATE NEW TASK'}</span>
        </button>
      </div>

      {/* Add Task Form Panel */}
      {showAddForm && (
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <h4 className="text-sm font-mono font-bold text-neon-purple uppercase mb-4">
            Create a New Task
          </h4>
          <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Task Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-purple transition"
                placeholder="Follow up with Radiant Smiles"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Assign to AI Role</label>
              <select
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-purple transition"
              >
                <option value="CEO Agent">General AI Assistant</option>
                <option value="Lead Research Agent">AI Lead Scorer</option>
                <option value="Outreach Agent">AI Email Outbox Writer</option>
                <option value="Follow-up Agent">AI Follow-up Reminder</option>
                <option value="Proposal Agent">AI Proposal Writer</option>
                <option value="Content Agent">AI Social Media Writer</option>
                <option value="Delivery Manager Agent">AI Project Checklist Planner</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-purple transition"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical (Do Immediately)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Link to Business Goal</label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-purple transition"
              >
                <option value="">No goal linkage</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-purple transition"
              />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Task Details / Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded p-3 text-foreground focus:outline-none focus:border-neon-purple transition"
                placeholder="Type description here..."
              />
            </div>
            <div className="md:col-span-2 xl:col-span-3 flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-white/10 rounded text-muted-foreground hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-neon-purple hover:bg-neon-purple/80 text-white rounded font-mono font-bold transition cursor-pointer"
              >
                {submitting ? 'SAVING...' : 'SAVE TASK'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban columns */}
      {tasks.length > 0 ? (
        <TaskBoard
          tasks={tasks}
          onUpdateStatus={handleUpdateStatus}
          onDeleteTask={handleDeleteTask}
        />
      ) : (
        <EmptyState
          title="No Tasks Found"
          description="No checklist tasks found. You can add a task manually using the button above."
          actionLabel="Add a Task"
          onAction={() => setShowAddForm(true)}
        />
      )}
    </div>
  );
}
