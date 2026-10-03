'use client';

import React from 'react';
import Link from 'next/link';
import { VxIcon } from './VxIcon';

/**
 * Breadcrumbs for pages that sit below the top level of the sidebar, so the
 * user can always answer "where am I, and how do I get back?".
 *
 * The last crumb is the current page: it is not a link, and carries
 * aria-current="page" so it is announced as the destination rather than
 * offered as somewhere to go.
 */

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, style }: { items: Crumb[]; style?: React.CSSProperties }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" style={style}>
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          listStyle: 'none',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
        }}
      >
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {isLast || !c.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  style={{ color: isLast ? 'var(--text-body)' : 'inherit' }}
                >
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {c.label}
                </Link>
              )}

              {!isLast ? (
                <span style={{ display: 'inline-flex', color: 'var(--text-dim)' }}>
                  <VxIcon name="chevronRight" size={12} />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
