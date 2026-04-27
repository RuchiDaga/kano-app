import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = {
  product_manager: [
    { label: 'Dashboard Overview', icon: '⊞', key: 'dashboard' },
    { label: 'Add Feature', icon: '+', key: 'add-feature' },
    { label: 'Feature Backlog', icon: '≡', key: 'backlog' },
    { label: 'Stakeholder Feedback', icon: '☐', key: 'feedback' },
    { label: 'Kano Analysis', icon: '⌖', key: 'kano' },
    { label: 'Assign Features', icon: '⊙', key: 'assign' },
    { label: 'Reports and Analytics', icon: '⊟', key: 'reports' },
  ],
  dev_team: [
    { label: 'Dashboard', icon: '⊞', key: 'dashboard' },
    { label: 'Assigned Features', icon: '⊟', key: 'assigned' },
    { label: 'My Tasks', icon: '✓', key: 'tasks' },
    { label: 'Update Status', icon: '↻', key: 'status' },
  ],
  stakeholder: [
    { label: 'Dashboard', icon: '⊞', key: 'dashboard' },
    { label: 'Feature Feedback', icon: '☐', key: 'feedback' },
    { label: 'My Responses', icon: '✓', key: 'responses' },
    { label: 'Feature List', icon: '≡', key: 'features' },
  ]
};

const ROLE_LABELS = {
  product_manager: 'Product Manager',
  dev_team: 'Developer',
  stakeholder: 'Stakeholder'
};

export default function Layout({ children, activePage, onNavigate }) {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = NAV_ITEMS[user?.role] || [];
  const roleLabel = ROLE_LABELS[user?.role] || '';

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8f9ff', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 260, background: '#fff', borderRight: '1px solid #e8eaf0',
        display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e8eaf0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, background: '#6366f1', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff'
            }}>👥</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Kano Backlog</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{roleLabel}</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activePage === item.key ? '#eff0ff' : 'transparent',
                color: activePage === item.key ? '#6366f1' : '#475569',
                fontWeight: activePage === item.key ? 600 : 400,
                fontSize: 13.5, textAlign: 'left', marginBottom: 2,
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sign Out */}
        <div style={{ padding: '12px 12px', borderTop: '1px solid #e8eaf0' }}>
          <button
            onClick={signOut}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#475569', fontSize: 13.5, textAlign: 'left'
            }}
          >
            <span>→</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Navbar */}
        <header style={{
          height: 60, background: '#fff', borderBottom: '1px solid #e8eaf0',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16
        }}>
          {/* Search */}
          <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}>🔍</span>
            <input
              placeholder="Search features, tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '7px 12px 7px 36px', borderRadius: 8,
                border: '1px solid #e8eaf0', fontSize: 13.5, color: '#334155',
                background: '#f8f9ff', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Bell */}
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <span style={{ fontSize: 18, color: '#64748b' }}>🔔</span>
            <div style={{
              position: 'absolute', top: -2, right: -2, width: 8, height: 8,
              background: '#ef4444', borderRadius: '50%'
            }} />
          </div>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: '#eff0ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
            }}>👤</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{user?.email}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{roleLabel}</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: 28 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
