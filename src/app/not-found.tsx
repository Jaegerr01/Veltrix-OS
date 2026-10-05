import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: 28, textAlign: 'center', color: 'var(--text-body)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, color: 'var(--text-strong)' }}>404</div>
      <p style={{ marginTop: 8 }}>That page does not exist.</p>
      <Link href="/" style={{ display: 'inline-block', marginTop: 16, padding: '8px 16px', borderRadius: 10, background: 'var(--grad-brand)', color: '#fff', fontWeight: 600 }}>Back to the dashboard</Link>
    </div>
  );
}
