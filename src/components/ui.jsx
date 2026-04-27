// Shared UI components matching the wireframe design system

export function StatCard({ label, value, subtext, subcolor = '#10b981', icon }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: '1px solid #e8eaf0',
      padding: '20px 24px', flex: 1, minWidth: 0
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span style={{ fontSize: 13.5, color: '#64748b', fontWeight: 500 }}>{label}</span>
        <div style={{
          width: 32, height: 32, background: '#eff0ff', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
        }}>{icon}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: subcolor }}>{subtext}</div>
    </div>
  );
}

export function StatusBar({ label, count, total, color = '#6366f1' }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13.5, color: '#334155', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color: '#64748b' }}>{count} ({pct}%)</span>
      </div>
      <div style={{ height: 6, background: '#e8eaf0', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

export function ActivityItem({ title, status, date, dot = '#6366f1' }) {
  const STATUS_LABELS = {
    to_do: 'To Do', in_progress: 'In Progress', testing: 'Testing', completed: 'Completed'
  };
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>Status: {STATUS_LABELS[status] || status}</div>
      </div>
      {date && <div style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>{date?.slice(0,10)}</div>}
    </div>
  );
}

export function SectionCard({ title, children, style = {} }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8eaf0', padding: '24px', ...style }}>
      {title && <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 20 }}>{title}</div>}
      {children}
    </div>
  );
}

export function Badge({ text, category }) {
  const colors = {
    must_be: { bg: '#fef2f2', color: '#ef4444' },
    one_dimensional: { bg: '#eff0ff', color: '#6366f1' },
    attractive: { bg: '#f0fdf4', color: '#10b981' },
    indifferent: { bg: '#f8fafc', color: '#64748b' },
    reverse: { bg: '#fffbeb', color: '#f59e0b' },
    to_do: { bg: '#eff0ff', color: '#6366f1' },
    in_progress: { bg: '#fffbeb', color: '#f59e0b' },
    testing: { bg: '#fef2f2', color: '#ef4444' },
    completed: { bg: '#f0fdf4', color: '#10b981' },
  };
  const c = colors[category] || { bg: '#f8fafc', color: '#64748b' };
  return (
    <span style={{
      background: c.bg, color: c.color, padding: '2px 10px',
      borderRadius: 20, fontSize: 11.5, fontWeight: 600
    }}>{text}</span>
  );
}

export function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{title}</h1>
      <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>{subtitle}</p>
    </div>
  );
}

export function LoggedInBadge({ role }) {
  const labels = { product_manager: 'Product Manager', dev_team: 'Developer', stakeholder: 'Stakeholder' };
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: '#0f172a', color: '#fff', padding: '10px 16px',
      borderRadius: 10, fontSize: 13, fontWeight: 500
    }}>
      <span style={{ color: '#10b981', fontSize: 16 }}>✓</span>
      Logged in as {labels[role] || role}
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, style = {}, variant = 'primary' }) {
  const base = {
    padding: '10px 20px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14, fontWeight: 600, transition: 'all 0.15s', opacity: disabled ? 0.6 : 1, ...style
  };
  if (variant === 'primary') return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, background: '#6366f1', color: '#fff' }}>{children}</button>
  );
  if (variant === 'dark') return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, background: '#0f172a', color: '#fff' }}>{children}</button>
  );
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, background: '#f1f5f9', color: '#334155' }}>{children}</button>
  );
}

export function InputField({ label, type = 'text', value, onChange, placeholder, icon, style = {} }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && <label style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: '#334155', marginBottom: 6 }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: '100%', padding: icon ? '10px 12px 10px 36px' : '10px 12px',
            border: '1px solid #e8eaf0', borderRadius: 8, fontSize: 13.5,
            color: '#334155', background: '#f8f9ff', outline: 'none', boxSizing: 'border-box'
          }}
        />
      </div>
    </div>
  );
}

export function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: '#334155', marginBottom: 6 }}>{label}</label>}
      <select
        value={value}
        onChange={onChange}
        style={{
          width: '100%', padding: '10px 12px', border: '1px solid #e8eaf0',
          borderRadius: 8, fontSize: 13.5, color: value ? '#334155' : '#94a3b8',
          background: '#f8f9ff', outline: 'none', appearance: 'none', cursor: 'pointer'
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 32, height: 32, border: '3px solid #e8eaf0',
        borderTop: '3px solid #6366f1', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function EmptyState({ icon = '📭', message = 'No data yet' }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}
