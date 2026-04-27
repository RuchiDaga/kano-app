import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserControl, FeatureControl } from '../lib/supabase';
import Layout from '../components/layout/Layout';
import {
  StatCard, StatusBar, SectionCard, PageHeader,
  LoggedInBadge, Badge, Spinner, EmptyState, PrimaryButton
} from '../components/ui';

// ECB Boundary: DevTeamUI
export default function DevTeamDashboard() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [assignedFeatures, setAssignedFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [s, af] = await Promise.all([
        UserControl.getDashboardStats(user.id, user.role),
        FeatureControl.getFeaturesByAssignee(user.id)
      ]);
      setStats(s);
      setAssignedFeatures(af || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleStatusUpdate(featureId, newStatus) {
    try {
      await FeatureControl.updateFeatureStatus(featureId, newStatus);
      setMsg('✅ Status updated successfully!');
      loadData();
    } catch (e) { setMsg('❌ ' + e.message); }
  }

  const sc = stats?.statusCount || {};
  const total = assignedFeatures.length;

  const STATUS_OPTIONS = [
    { value: 'to_do', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'testing', label: 'Testing' },
    { value: 'completed', label: 'Completed' },
  ];

  const renderDashboard = () => (
    <>
      <PageHeader title="Developer Dashboard" subtitle="Track your assigned features and tasks" />
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="Assigned Features" value={stats?.totalAssigned ?? 0} subtext="Total features assigned" icon="⊟" subcolor="#64748b" />
        <StatCard label="Tasks In Progress" value={stats?.inProgress ?? 0} subtext="Currently working on" icon="⟳" subcolor="#64748b" />
        <StatCard label="Completed Tasks" value={stats?.completed ?? 0} subtext="Successfully delivered" icon="✓" />
        <StatCard label="Upcoming Deadlines" value={stats?.upcoming ?? 0} subtext="In backlog" icon="🕐" subcolor="#64748b" />
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <SectionCard title="My Assigned Features" style={{ flex: 1.4 }}>
          {assignedFeatures.length ? assignedFeatures.map(f => (
            <div key={f.id} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{f.description?.slice(0,70)}…</div>
                </div>
                <Badge text={f.status?.replace('_', ' ')} category={f.status} />
              </div>
            </div>
          )) : <EmptyState message="No features assigned yet" />}
        </SectionCard>

        <SectionCard title="Task Status Distribution" style={{ flex: 1 }}>
          <StatusBar label="To Do" count={sc.to_do || 0} total={total} />
          <StatusBar label="In Progress" count={sc.in_progress || 0} total={total} />
          <StatusBar label="Testing" count={sc.testing || 0} total={total} />
          <StatusBar label="Completed" count={sc.completed || 0} total={total} />
          <div style={{ marginTop: 20 }}><LoggedInBadge role={user.role} /></div>
        </SectionCard>
      </div>
    </>
  );

  const renderAssigned = () => (
    <>
      <PageHeader title="Assigned Features" subtitle="All features assigned to you" />
      <SectionCard>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e8eaf0' }}>
              {['Feature', 'Description', 'Status', 'Created'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assignedFeatures.length ? assignedFeatures.map(f => (
              <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>{f.title}</td>
                <td style={{ padding: '12px', color: '#64748b', maxWidth: 200 }}>{f.description?.slice(0, 60)}…</td>
                <td style={{ padding: '12px' }}><Badge text={f.status?.replace('_', ' ')} category={f.status} /></td>
                <td style={{ padding: '12px', color: '#94a3b8', fontSize: 12 }}>{f.created_at?.slice(0,10)}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No features assigned yet</td></tr>
            )}
          </tbody>
        </table>
      </SectionCard>
    </>
  );

  const renderTasks = () => {
    const byStatus = { to_do: [], in_progress: [], testing: [], completed: [] };
    assignedFeatures.forEach(f => { if (byStatus[f.status]) byStatus[f.status].push(f); });
    const COLS = [
      { key: 'to_do', label: 'To Do', color: '#6366f1' },
      { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
      { key: 'testing', label: 'Testing', color: '#ef4444' },
      { key: 'completed', label: 'Completed', color: '#10b981' },
    ];
    return (
      <>
        <PageHeader title="My Tasks" subtitle="Kanban view of your work" />
        <div style={{ display: 'flex', gap: 16 }}>
          {COLS.map(col => (
            <div key={col.key} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                <span style={{ fontWeight: 700, fontSize: 13.5, color: '#334155' }}>{col.label}</span>
                <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 11, padding: '1px 8px', borderRadius: 20, fontWeight: 600 }}>{byStatus[col.key].length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {byStatus[col.key].map(f => (
                  <div key={f.id} style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: 10, padding: '14px' }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0f172a', marginBottom: 4 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{f.description?.slice(0,60)}…</div>
                  </div>
                ))}
                {!byStatus[col.key].length && (
                  <div style={{ background: '#f8f9ff', border: '1px dashed #e8eaf0', borderRadius: 10, padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                    Empty
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderStatus = () => (
    <>
      <PageHeader title="Update Status" subtitle="Change the status of your assigned features" />
      {msg && <div style={{ background: msg.includes('✅') ? '#f0fdf4' : '#fef2f2', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, color: msg.includes('✅') ? '#16a34a' : '#ef4444' }}>{msg}</div>}
      <SectionCard>
        {assignedFeatures.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e8eaf0' }}>
                {['Feature', 'Current Status', 'Update To'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignedFeatures.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{f.description?.slice(0,50)}…</div>
                  </td>
                  <td style={{ padding: '14px 12px' }}><Badge text={f.status?.replace('_', ' ')} category={f.status} /></td>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {STATUS_OPTIONS.filter(s => s.value !== f.status).map(s => (
                        <button key={s.value} onClick={() => handleStatusUpdate(f.id, s.value)}
                          style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e8eaf0', background: '#f8f9ff', color: '#334155', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                          → {s.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState message="No features assigned to you yet" />}
      </SectionCard>
    </>
  );

  const pages = { dashboard: renderDashboard, assigned: renderAssigned, tasks: renderTasks, status: renderStatus };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {loading ? <Spinner /> : (pages[activePage] || renderDashboard)()}
    </Layout>
  );
}
