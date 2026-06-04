'use client';

import React from 'react';
import { Task } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { Clock, ArrowRight, ArrowLeft, Trash2, CheckCircle2 } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  onUpdateStatus: (taskId: string, newStatus: Task['status']) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function TaskBoard({ tasks, onUpdateStatus, onDeleteTask }: TaskBoardProps) {
  const columns: { label: string; status: Task['status']; color: string }[] = [
    { label: 'To-Do List', status: 'Pending', color: 'border-t-2 border-t-white/30' },
    { label: 'Working On', status: 'In Progress', color: 'border-t-2 border-t-neon-cyan' },
    { label: 'Needs Review', status: 'Needs Approval', color: 'border-t-2 border-t-neon-purple' },
    { label: 'Completed', status: 'Completed', color: 'border-t-2 border-t-neon-green' }
  ];

  const getPriorityColor = (p: Task['priority']) => {
    switch (p) {
      case 'Critical': return 'text-neon-pink bg-neon-pink/10 border-neon-pink/20';
      case 'High': return 'text-neon-orange bg-neon-orange/10 border-neon-orange/20';
      case 'Medium': return 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20';
      case 'Low':
      default:
        return 'text-muted-foreground bg-white/5 border-white/10';
    }
  };

  const getNextStatus = (curr: Task['status']): Task['status'] | null => {
    if (curr === 'Pending') return 'In Progress';
    if (curr === 'In Progress') return 'Needs Approval';
    if (curr === 'Needs Approval') return 'Completed';
    return null;
  };

  const getPrevStatus = (curr: Task['status']): Task['status'] | null => {
    if (curr === 'Completed') return 'Needs Approval';
    if (curr === 'Needs Approval') return 'In Progress';
    if (curr === 'In Progress') return 'Pending';
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 my-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            className={`glass-panel border border-white/5 rounded-xl bg-cyber-bg/25 p-4 flex flex-col min-h-[450px] ${col.color}`}
          >
            {/* Column Header */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-foreground">
                {col.label}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-mono font-bold text-muted-foreground">
                {colTasks.length}
              </span>
            </div>

            {/* Task list inside column */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
              {colTasks.length === 0 ? (
                <div className="h-32 border border-dashed border-white/5 rounded-lg flex items-center justify-center text-center p-4">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    No tasks in this list
                  </span>
                </div>
              ) : (
                colTasks.map((task) => {
                  const next = getNextStatus(task.status);
                  const prev = getPrevStatus(task.status);

                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg bg-white/3 border border-white/5 hover:border-white/10 transition flex flex-col justify-between"
                    >
                      {/* Task Info */}
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground uppercase">
                            {task.agent_name.replace('Agent', '').trim()}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-foreground mb-1 select-text">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-3 mb-2 select-text">
                            {task.description}
                          </p>
                        )}
                        {task.result && (
                          <div className="p-2 bg-neon-green/5 border border-neon-green/10 rounded text-[9px] font-mono text-neon-green mb-2 select-text">
                            👉 {task.result}
                          </div>
                        )}
                      </div>

                      {/* Task Actions */}
                      <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-2">
                        {/* Due date */}
                        <div className="flex items-center space-x-1 text-[9px] font-mono text-muted-foreground">
                          <Clock size={10} />
                          <span>{task.due_date ? task.due_date : 'No limit'}</span>
                        </div>

                        {/* Status update buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            title="Delete Task"
                            className="p-1 rounded hover:bg-neon-pink/10 text-muted-foreground hover:text-neon-pink transition cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                          
                          {prev && (
                            <button
                              onClick={() => onUpdateStatus(task.id, prev)}
                              title="Move back"
                              className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition cursor-pointer"
                            >
                              <ArrowLeft size={11} />
                            </button>
                          )}

                          {next && (
                            <button
                              onClick={() => onUpdateStatus(task.id, next)}
                              title="Move forward"
                              className="p-1 rounded bg-white/5 hover:bg-neon-purple/10 hover:text-neon-purple border border-white/5 text-muted-foreground transition cursor-pointer"
                            >
                              <ArrowRight size={11} />
                            </button>
                          )}

                          {task.status !== 'Completed' && (
                            <button
                              onClick={() => onUpdateStatus(task.id, 'Completed')}
                              title="Mark Completed"
                              className="p-1 rounded hover:bg-neon-green/10 text-muted-foreground hover:text-neon-green transition cursor-pointer"
                            >
                              <CheckCircle2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
