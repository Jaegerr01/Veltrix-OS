'use client';

import React from 'react';
import { Modal } from '@/components/ds';
import { NAV_ROUTES } from '@/lib/nav';

const Row = ({ keys, label }: { keys: string[]; label: string }) => (
  <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
    <span>{label}</span>
    <span style={{ display: 'inline-flex', gap: 6 }}>{keys.map((k, i) => <kbd key={i} className="vx-kbd">{k}</kbd>)}</span>
  </li>
);

export default function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" description="Shortcuts are disabled while you are typing in a field." size="md">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
        <Row keys={['Ctrl / Cmd', 'K']} label="Open the command palette" />
        <Row keys={['?']} label="Show this help" />
        <Row keys={['Esc']} label="Close dialogs, the palette or the menu" />
        {NAV_ROUTES.filter(r => r.key).map(r => <Row key={r.path} keys={['g', r.key!]} label={`Go to ${r.label}`} />)}
        <Row keys={['Ctrl / Cmd', 'S']} label="Save the open memory note" />
      </ul>
    </Modal>
  );
}
