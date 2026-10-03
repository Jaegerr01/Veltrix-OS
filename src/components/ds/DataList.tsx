'use client';

import React from 'react';

/**
 * One table that becomes a stack of cards on small screens.
 *
 * Nine pages hand-rolled CSS-grid rows with fixed column widths, which simply
 * overflowed on a phone. Rather than shrinking that layout, this recomposes it:
 * a real <table> on desktop, and below `md` each row folds into a card with the
 * column header shown as a label beside each value (via `data-label`).
 *
 * The display switch is done in CSS (see `.vx-datalist` in veltrix-ds.css) so
 * there is no matchMedia, no hydration mismatch, and one copy of the DOM.
 * Because overriding `display` on table elements strips their implicit
 * semantics, the ARIA roles are set explicitly — otherwise screen readers would
 * stop announcing rows and columns at exactly the width where orientation
 * matters most.
 */

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /** Right-align and use tabular figures — for money, counts, dates. */
  numeric?: boolean;
  /** Becomes the card title in the mobile layout. Mark exactly one column. */
  primary?: boolean;
}

export function DataList<T>({
  items,
  columns,
  getKey,
  caption,
  empty,
  onRowClick,
  style,
}: {
  items: T[];
  columns: Column<T>[];
  getKey: (row: T) => string;
  /** Describes the table for screen readers. Visually hidden. */
  caption: string;
  /** Shown instead of the table when there is nothing to list. */
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  style?: React.CSSProperties;
}) {
  if (items.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="vx-datalist" style={style}>
      <table role="table">
        <caption
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            whiteSpace: 'nowrap',
          }}
        >
          {caption}
        </caption>

        <thead role="rowgroup">
          <tr role="row">
            {columns.map((c) => (
              <th
                key={c.key}
                role="columnheader"
                scope="col"
                style={{ textAlign: c.numeric ? 'right' : 'left' }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody role="rowgroup">
          {items.map((row) => {
            const clickable = Boolean(onRowClick);
            return (
              <tr
                key={getKey(row)}
                role="row"
                data-clickable={clickable ? 'true' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => onRowClick!(row) : undefined}
                // A clickable row must also be operable from the keyboard.
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick!(row);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    role="cell"
                    data-label={c.header}
                    data-primary={c.primary ? 'true' : undefined}
                    style={{
                      textAlign: c.numeric ? 'right' : 'left',
                      fontVariantNumeric: c.numeric ? 'tabular-nums' : undefined,
                    }}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DataList;
