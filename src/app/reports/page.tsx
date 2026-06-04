'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { DailyReport } from '@/lib/types';
import DailyReportCard from '@/components/DailyReportCard';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import { ClipboardList } from 'lucide-react';

export default function DailyReportsHistory() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    try {
      const rps = await db.getDailyReports();
      setReports(rps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) {
    return <LoadingState message="LOADING DAILY SUMMARIES..." />;
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center space-x-2 text-neon-purple">
        <ClipboardList size={20} />
        <span className="font-mono text-sm font-bold uppercase tracking-wider">Daily Summaries</span>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="No Summaries Created Yet"
          description="Summaries are created inside the Chat with AI Assistant page. Go there to create your first daily action plan."
        />
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <DailyReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
