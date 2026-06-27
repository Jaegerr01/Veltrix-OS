'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Project, Client } from '@/lib/types';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { FolderGit2, CheckCircle2, ShieldCheck, Calendar, FileText } from 'lucide-react';

export default function ProjectsCenter() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Completed items trackers (local state map keys: `{projectId}-{itemIndex}`)
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});

  async function loadData() {
    try {
      const projs = await db.getProjects();
      const clts = await db.getClients();
      setProjects(projs);
      setClients(clts);

      // Initialize checked checklist states based on mocked database structure or default state
      // For fallback persistence, we simulate saving completed items in localStorage
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('veltrix_projects_checklist');
        if (saved) {
          setCheckedMap(JSON.parse(saved));
        }
      }
    } catch (e) {
      console.warn('Failed to load projects data:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.business_name : 'Unknown Account';
  };

  const handleToggleChecklist = (projectId: string, index: number) => {
    const key = `${projectId}-${index}`;
    const newVal = !checkedMap[key];
    const updated = { ...checkedMap, [key]: newVal };
    setCheckedMap(updated);

    if (typeof window !== 'undefined') {
      localStorage.setItem('veltrix_projects_checklist', JSON.stringify(updated));
    }
  };

  const handleUpdateStage = async (id: string, newStage: Project['status']) => {
    try {
      await db.updateProject(id, { status: newStage });
      // If marked as Completed, sync client or log success
      if (newStage === 'Completed') {
        // Log task complete or similar action
      }
      await loadData();
      alert(`Project stage updated to ${newStage}`);
    } catch (err) {
      console.warn('Failed to update project stage:', err);
    }
  };

  if (loading) {
    return <LoadingState message="LOADING PROJECTS..." />;
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center space-x-2 text-neon-cyan">
        <FolderGit2 size={20} />
        <span className="font-mono text-sm font-bold uppercase tracking-wider">Projects Checklist</span>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No Projects Started"
          description="Projects will appear here automatically when proposals are marked as Accepted. You can start by sending a proposal to a lead."
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {projects.map((proj) => {
            // Calculate checklist progress percentages
            const totalItems = proj.deliverables.length;
            const completedCount = proj.deliverables.filter((_, idx) => checkedMap[`${proj.id}-${idx}`]).length;
            const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

            return (
              <div
                key={proj.id}
                className="glass-panel border border-white/5 rounded-xl bg-cyber-bg/30 p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Header Title */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-foreground select-text">{proj.project_name}</h4>
                      <span className="text-[10px] text-neon-cyan font-mono block">
                        CLIENT: {getClientName(proj.client_id)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={proj.status} />
                      <select
                        value={proj.status}
                        onChange={(e) => handleUpdateStage(proj.id, e.target.value as any)}
                        className="bg-white/5 border border-white/10 rounded text-[10px] px-1 py-0.5 text-foreground focus:outline-none focus:border-neon-cyan font-mono cursor-pointer"
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
                  </div>

                  {/* Deadline & Spec details */}
                  <div className="flex space-x-4 font-mono text-[10px] text-muted-foreground my-2 bg-white/2 p-2 rounded">
                    <div className="flex items-center space-x-1">
                      <Calendar size={11} className="text-neon-pink" />
                      <span>DUE: {proj.deadline || 'No limit'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText size={11} className="text-neon-cyan" />
                      <span>TYPE: {proj.service_type}</span>
                    </div>
                  </div>

                  {/* Progress percent display */}
                  <div className="my-3">
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono mb-1">
                      <span>PROGRESS CHECKLIST</span>
                      <span className="text-neon-cyan font-bold">{progressPercent}% DONE</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                      <div
                        className="bg-neon-cyan h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Deliverables Checklist list */}
                  <div className="mt-4">
                    <span className="text-[10px] text-muted-foreground block font-mono uppercase tracking-wider mb-2">
                      Tasks to Complete:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {proj.deliverables.map((item, index) => {
                        const isChecked = !!checkedMap[`${proj.id}-${index}`];
                        return (
                          <label
                            key={index}
                            className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition select-none ${
                              isChecked
                                ? 'bg-neon-cyan/5 border-neon-cyan/20 text-neon-cyan/95'
                                : 'bg-white/2 border-white/5 text-muted-foreground hover:bg-white/5'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleChecklist(proj.id, index)}
                              className="w-3.5 h-3.5 rounded accent-neon-cyan cursor-pointer border-white/20 bg-white/5"
                            />
                            <span className="text-[11px] leading-tight truncate">{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer notes */}
                {proj.notes && (
                  <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-muted-foreground font-sans italic select-text">
                    ⚠️ Note: {proj.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
