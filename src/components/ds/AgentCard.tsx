'use client';

import React from 'react';
import { VxIcon } from './VxIcon';
import { STATUS_COLOR, STATUS_LABEL, type AgentDef } from './agents';

/** Signature agent tile: glass panel, glowing icon orb, live status dot, headline metric.
 *  Layout lives in ui.css (.vx-agent*); only the per-agent colour and stagger delay are inline. */
export default function AgentCard({ agent, index = 0 }: { agent: AgentDef; index?: number }) {
  const color = STATUS_COLOR[agent.status];
  return (
    <div className="vx-glass vx-agent" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="vx-agent__top">
        <span className="vx-agent__orb">
          <VxIcon name={agent.iconName} size={22} />
        </span>
        <div className="vx-agent__body">
          <div className="vx-agent__name">{agent.name}</div>
          <div className="vx-agent__role">{agent.role}</div>
        </div>
        <span
          className="vx-agent__dot"
          title={STATUS_LABEL[agent.status]}
          style={{ background: color, boxShadow: agent.status === 'active' ? `0 0 8px ${color}` : 'none' }}
        />
      </div>
      <div className="vx-agent__metrics">
        <span className="vx-agent__metric">{agent.metric}</span>
        <span className="vx-agent__metric-label">{agent.metricLabel}</span>
      </div>
    </div>
  );
}
