'use client';

import React, { useState } from 'react';
import { Target, Calculator, Percent, ArrowUpRight } from 'lucide-react';

interface RevenueProgressProps {
  closedRevenue: number;
  targetRevenue: number;
}

export default function RevenueProgress({ closedRevenue, targetRevenue }: RevenueProgressProps) {
  const [leads, setLeads] = useState<number>(20);
  const [bookedRate, setBookedRate] = useState<number>(40); // 40%
  const [closeRate, setCloseRate] = useState<number>(25); // 25%
  const [dealValue, setDealValue] = useState<number>(1200);

  // Calculations
  const bookedCalls = Math.round((leads * bookedRate) / 100);
  const closedDeals = Math.round((bookedCalls * closeRate) / 100);
  const calculatedRevenue = closedDeals * dealValue;
  const progressPercent = Math.min(100, Math.round((closedRevenue / targetRevenue) * 100));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 my-6">
      {/* 1. Progress Bar & Core KPIs */}
      <div className="xl:col-span-1 glass-panel p-6 border border-white/5 rounded-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-neon-purple mb-4">
            <Target size={20} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">Your Earnings Goal</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground font-mono mb-1">
                <span>PERCENT DONE</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3.5 overflow-hidden border border-white/5 p-[2px]">
                <div
                  className="bg-gradient-to-r from-neon-purple to-neon-cyan h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 font-mono">
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-muted-foreground block uppercase">Money Earned</span>
                <span className="text-xl font-bold text-neon-green">${closedRevenue.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-muted-foreground block uppercase">Left to Go</span>
                <span className="text-xl font-bold text-neon-pink">
                  ${Math.max(0, targetRevenue - closedRevenue).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground mt-4 italic">
          To reach $6,000/month, focus on offering monthly retainer services.
        </div>
      </div>

      {/* 2. Revenue Formula Calculator */}
      <div className="xl:col-span-1 glass-panel p-6 border border-white/5 rounded-xl">
        <div className="flex items-center justify-between text-neon-cyan mb-4">
          <div className="flex items-center space-x-2">
            <Calculator size={20} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">Earnings Calculator</h3>
          </div>
          <span className="text-xs font-mono bg-neon-cyan/10 px-2 py-0.5 rounded text-neon-cyan">
            Interactive Tool
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {/* Leads Slider */}
          <div>
            <div className="flex justify-between font-mono mb-1">
              <span>Leads (People interested):</span>
              <span className="text-neon-cyan font-bold">{leads}</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={leads}
              onChange={(e) => setLeads(Number(e.target.value))}
              className="w-full accent-neon-cyan cursor-pointer bg-white/10 h-1 rounded"
            />
          </div>

          {/* Booked Call Rate Slider */}
          <div>
            <div className="flex justify-between font-mono mb-1">
              <span>Percent that Book a Call:</span>
              <span className="text-neon-cyan font-bold">{bookedRate}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={bookedRate}
              onChange={(e) => setBookedRate(Number(e.target.value))}
              className="w-full accent-neon-cyan cursor-pointer bg-white/10 h-1 rounded"
            />
          </div>

          {/* Close Rate Slider */}
          <div>
            <div className="flex justify-between font-mono mb-1">
              <span>Percent that Hire Us (Close Rate):</span>
              <span className="text-neon-cyan font-bold">{closeRate}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={closeRate}
              onChange={(e) => setCloseRate(Number(e.target.value))}
              className="w-full accent-neon-cyan cursor-pointer bg-white/10 h-1 rounded"
            />
          </div>

          {/* Average Deal Value Slider */}
          <div>
            <div className="flex justify-between font-mono mb-1">
              <span>Average Price per Client:</span>
              <span className="text-neon-cyan font-bold">${dealValue.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="500"
              max="3000"
              step="100"
              value={dealValue}
              onChange={(e) => setDealValue(Number(e.target.value))}
              className="w-full accent-neon-cyan cursor-pointer bg-white/10 h-1 rounded"
            />
          </div>

          {/* Result Formula Output */}
          <div className="p-2.5 bg-neon-cyan/5 border border-neon-cyan/20 rounded mt-3 text-center">
            <span className="text-[10px] text-muted-foreground block font-mono">ESTIMATED MONTHLY EARNINGS</span>
            <div className="text-lg font-mono font-bold text-neon-cyan">
              ${calculatedRevenue.toLocaleString()}/mo
            </div>
            <span className="text-[9px] text-muted-foreground block font-mono mt-0.5">
              {leads} leads × {bookedRate}% booked ({bookedCalls} calls) × {closeRate}% close ({closedDeals} deals) × ${dealValue}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Model Targets */}
      <div className="xl:col-span-1 glass-panel p-6 border border-white/5 rounded-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-neon-pink mb-4">
            <ArrowUpRight size={20} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">Choose Your Strategy</h3>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {/* Model A */}
            <div className="p-2.5 rounded bg-white/5 border border-white/5 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-neon-pink block uppercase font-bold">Plan A: Focus on Websites</span>
                <span className="text-muted-foreground">4 Web Deliveries at $1,500</span>
              </div>
              <span className="font-bold text-foreground">$6,000</span>
            </div>

            {/* Model B */}
            <div className="p-2.5 rounded bg-neon-purple/5 border border-neon-purple/20 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-neon-purple block uppercase font-bold">Plan B: Mix of Setup & Retainers (Best)</span>
                <span className="text-muted-foreground">4 Setups ($1k) + 8 Retainers ($250)</span>
              </div>
              <span className="font-bold text-neon-purple">$6,000</span>
            </div>

            {/* Model C */}
            <div className="p-2.5 rounded bg-white/5 border border-white/5 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-neon-cyan block uppercase font-bold">Plan C: High-Ticket Tech Packages</span>
                <span className="text-muted-foreground">3 Growth Packages at $2,000</span>
              </div>
              <span className="font-bold text-foreground">$6,000</span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
          💡 <span className="text-neon-cyan">Recommended</span>: Sell AI Assistant installs ($1,000 setup fee + $250 monthly fee) to get recurring income.
        </div>
      </div>
    </div>
  );
}
