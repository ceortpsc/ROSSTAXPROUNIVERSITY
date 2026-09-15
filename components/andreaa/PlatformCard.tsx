import type { ReactNode } from 'react';

type Props = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  href?: string;
  status?: string;
};

export default function PlatformCard({ title, eyebrow, children, href, status }: Props) {
  const body = (
    <article style={{ background: '#fff', border: '1px solid #d8d2c4', borderRadius: 18, padding: 20, boxShadow: '0 8px 22px rgba(15,23,42,.05)', minHeight: 180 }}>
      {eyebrow ? <div style={{ color: '#9a7412', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{eyebrow}</div> : null}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
        <h3 style={{ color: '#0b1f3a', margin: '7px 0 10px' }}>{title}</h3>
        {status ? <span style={{ background: '#fff8df', border: '1px solid #e3c565', borderRadius: 999, padding: '5px 8px', fontSize: 11, fontWeight: 800, color: '#6b4f00' }}>{status}</span> : null}
      </div>
      <div style={{ color: '#4b5563', lineHeight: 1.6 }}>{children}</div>
      {href ? <div style={{ marginTop: 14, color: '#9a7412', fontWeight: 800 }}>Open surface →</div> : null}
    </article>
  );

  return href ? <a href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{body}</a> : body;
}
