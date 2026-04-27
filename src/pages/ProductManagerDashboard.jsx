import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserControl, FeatureControl, BacklogControl, FeedbackControl, UserControl as UC } from '../lib/supabase';
import Layout from '../components/layout/Layout';
import {
  StatCard, StatusBar, ActivityItem, SectionCard,
  PageHeader, LoggedInBadge, PrimaryButton, InputField,
  SelectField, Badge, Spinner, EmptyState
} from '../components/ui';

// ECB Boundary: ProductManagerUI
export default function ProductManagerDashboard() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [features, setFeatures] = useState([]);
  const [backlog, setBacklog] = useState([]);
  const [devTeam, setDevTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Add feature form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Assign form
  const [assignFeatureId, setAssignFeatureId] = useState('');
  const [assignDevId, setAssignDevId] = useState('');

  useEffect(() => {
    loadData();
  }, [activePage]);

  async function loadData() {
    setLoading(true);
    try {
      const [s, f, b, d] = await Promise.all([
        UserControl.getDashboardStats(user.id, user.role),
        FeatureControl.getAllFeatures(),
        BacklogControl.getBacklog(),
        UC.getDevTeamMembers()
      ]);
      setStats(s);
      setFeatures(f || []);
      setBacklog(b || []);
      setDevTeam(d || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFeature() {
    if (!newTitle.trim() || !newDesc.trim()) { setMsg('Title and description required'); return; }
    try {
      await FeatureControl.createFeature(newTitle, newDesc, user.id);
      setNewTitle(''); setNewDesc('');
      setMsg('✅ Feature added successfully!');
      loadData();
    } catch (e) { setMsg('❌ ' + e.message); }
  }

  async function handleAssign() {
    if (!assignFeatureId || !assignDevId) { setMsg('Select feature and developer'); return; }
    try {
      await FeatureControl.assignFeature(assignFeatureId, assignDevId);
      setMsg('✅ Feature assigned successfully!');
      loadData();
    } catch (e) { setMsg('❌ ' + e.message); }
  }

  async function handleStatusChange(featureId, status) {
    try {
      await FeatureControl.updateFeatureStatus(featureId, status);
      setMsg('✅ Status updated');
      loadData();
    } catch (e) { setMsg('❌ ' + e.message); }
  }

  const total = stats?.totalFeatures || 0;
  const sc = stats?.statusCount || {};

  const renderDashboard = () => (
    <>
      <PageHeader title="Dashboard Overview" subtitle="Manage your product features and backlog" />
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Features" value={stats?.totalFeatures ?? 0} subtext="↑ 12% from last month" icon="⊞" />
        <StatCard label="Features Awaiting Feedback" value={stats?.awaitingFeedback ?? 0} subtext="Pending stakeholder input" icon="🕐" subcolor="#64748b" />
        <StatCard label="High Priority Features" value={stats?.highPriority ?? 0} subtext="Priority score ≥ 80" icon="↗" />
        <StatCard label="Completed Features" value={stats?.completed ?? 0} subtext="↑ 8% from last month" icon="✓" />
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <SectionCard title="Recent Activity" style={{ flex: 1.4 }}>
          {stats?.recentFeatures?.length ? stats.recentFeatures.map(f => (
            <ActivityItem key={f.id} title={f.title} status={f.status} date={f.created_at} />
          )) : <EmptyState message="No features yet" />}
        </SectionCard>
        <SectionCard title="Feature Status Distribution" style={{ flex: 1 }}>
          <StatusBar label="To Do" count={sc.to_do || 0} total={total} />
          <StatusBar label="In Progress" count={sc.in_progress || 0} total={total} />
          <StatusBar label="Testing" count={sc.testing || 0} total={total} />
          <StatusBar label="Completed" count={sc.completed || 0} total={total} />
          <div style={{ marginTop: 20 }}><LoggedInBadge role={user.role} /></div>
        </SectionCard>
      </div>
    </>
  );

  const renderAddFeature = () => (
    <>
      <PageHeader title="Add Feature" subtitle="Submit a new feature request to the backlog" />
      {msg && <div style={{ background: msg.includes('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.includes('✅') ? '#86efac' : '#fecaca'}`, color: msg.includes('✅') ? '#16a34a' : '#ef4444', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{msg}</div>}
      <SectionCard style={{ maxWidth: 600 }}>
        <InputField label="Feature Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Enter feature title" />
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: '#334155', marginBottom: 6 }}>Description</label>
          <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Describe the feature in detail..."
            rows={5} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8eaf0', borderRadius: 8, fontSize: 13.5, color: '#334155', background: '#f8f9ff', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
        <PrimaryButton onClick={handleAddFeature} variant="primary">Add Feature to Backlog</PrimaryButton>
      </SectionCard>
    </>
  );

  const renderBacklog = () => (
    <>
      <PageHeader title="Feature Backlog" subtitle="All features ranked by Kano priority score" />
      <SectionCard>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e8eaf0' }}>
              {['#', 'Feature', 'Status', 'Kano Category', 'Priority Score', 'Feedback Count', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {backlog.length ? backlog.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', color: '#94a3b8' }}>{i + 1}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.feature?.title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.feature?.description?.slice(0,50)}…</div>
                </td>
                <td style={{ padding: '12px' }}><Badge text={item.feature?.status?.replace('_', ' ')} category={item.feature?.status} /></td>
                <td style={{ padding: '12px' }}><Badge text={BacklogControl.getCategoryLabel(item.kano_category)} category={item.kano_category} /></td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#e8eaf0', borderRadius: 3, width: 60 }}>
                      <div style={{ height: '100%', width: `${Math.min(item.priority_score, 100)}%`, background: '#6366f1', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.priority_score}</span>
                  </div>
                </td>
                <td style={{ padding: '12px', color: '#64748b' }}>{item.feedback_count}</td>
                <td style={{ padding: '12px' }}>
                  <select onChange={e => handleStatusChange(item.feature?.id, e.target.value)} value={item.feature?.status}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e8eaf0', fontSize: 12, color: '#334155', background: '#f8f9ff' }}>
                    <option value="to_do">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="testing">Testing</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No backlog items yet. Add features and collect stakeholder feedback.</td></tr>
            )}
          </tbody>
        </table>
      </SectionCard>
    </>
  );

  const renderFeedback = () => (
    <>
      <PageHeader title="Stakeholder Feedback" subtitle="View all feedback submitted by stakeholders" />
      <SectionCard>
        {features.length ? features.map(f => (
          <div key={f.id} style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{f.title}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{f.description}</div>
              </div>
              <Badge text={f.status?.replace('_', ' ')} category={f.status} />
            </div>
          </div>
        )) : <EmptyState message="No features yet" />}
      </SectionCard>
    </>
  );

  const renderKano = () => {
    const categories = [
      { key: 'must_be', label: 'Must-Be', color: '#ef4444', desc: 'Basic requirements that customers expect' },
      { key: 'one_dimensional', label: 'One-Dimensional', color: '#6366f1', desc: 'More is better — directly correlated with satisfaction' },
      { key: 'attractive', label: 'Attractive', color: '#10b981', desc: 'Unexpected features that delight customers' },
      { key: 'indifferent', label: 'Indifferent', color: '#94a3b8', desc: 'Features that don\'t affect satisfaction' },
      { key: 'reverse', label: 'Reverse', color: '#f59e0b', desc: 'Features that actively reduce satisfaction' },
    ];
    return (
      <>
        <PageHeader title="Kano Analysis" subtitle="Feature distribution across Kano categories" />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          {categories.map(cat => {
            const count = backlog.filter(b => b.kano_category === cat.key).length;
            return (
              <div key={cat.key} style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 150 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, marginBottom: 10 }} />
                <div style={{ fontWeight: 700, fontSize: 24, color: '#0f172a' }}>{count}</div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: '#334155', marginTop: 2 }}>{cat.label}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{cat.desc}</div>
              </div>
            );
          })}
        </div>
        <SectionCard title="Priority Score by Feature">
          {backlog.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1, fontWeight: 500, fontSize: 13.5, color: '#0f172a' }}>{item.feature?.title}</div>
              <Badge text={BacklogControl.getCategoryLabel(item.kano_category)} category={item.kano_category} />
              <div style={{ width: 120, height: 6, background: '#e8eaf0', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${Math.min(item.priority_score, 100)}%`, background: BacklogControl.getCategoryColor(item.kano_category), borderRadius: 3 }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', width: 36, textAlign: 'right' }}>{item.priority_score}</span>
            </div>
          ))}
          {!backlog.length && <EmptyState message="No Kano data yet" />}
        </SectionCard>
      </>
    );
  };

  const renderAssign = () => (
    <>
      <PageHeader title="Assign Features" subtitle="Assign backlog features to development team members" />
      {msg && <div style={{ background: msg.includes('✅') ? '#f0fdf4' : '#fef2f2', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, color: msg.includes('✅') ? '#16a34a' : '#ef4444' }}>{msg}</div>}
      <SectionCard style={{ maxWidth: 600 }}>
        <SelectField label="Select Feature" value={assignFeatureId} onChange={e => setAssignFeatureId(e.target.value)} placeholder="Choose a feature"
          options={features.filter(f => f.status !== 'completed').map(f => ({ value: f.id, label: f.title }))} />
        <SelectField label="Assign To" value={assignDevId} onChange={e => setAssignDevId(e.target.value)} placeholder="Choose developer"
          options={devTeam.map(d => ({ value: d.id, label: `${d.name} (${d.email})` }))} />
        <PrimaryButton onClick={handleAssign} variant="primary">Assign Feature</PrimaryButton>
      </SectionCard>

      <div style={{ marginTop: 24 }}>
        <PageHeader title="Current Assignments" subtitle="" />
        <SectionCard>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e8eaf0' }}>
                {['Feature', 'Assigned To', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.filter(f => f.assigned_to).map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>{f.title}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{f.assignee?.name || f.assignee?.email || '—'}</td>
                  <td style={{ padding: '12px' }}><Badge text={f.status?.replace('_', ' ')} category={f.status} /></td>
                </tr>
              ))}
              {!features.filter(f => f.assigned_to).length && (
                <tr><td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No assignments yet</td></tr>
              )}
            </tbody>
          </table>
        </SectionCard>
      </div>
    </>
  );

  const renderReports = () => {
    const total = features.length;
    const sc = stats?.statusCount || {};
    return (
      <>
        <PageHeader title="Reports and Analytics" subtitle="Feature delivery metrics and performance" />
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Features" value={total} subtext="All time" icon="⊞" subcolor="#64748b" />
          <StatCard label="Completion Rate" value={`${total > 0 ? Math.round((sc.completed / total) * 100) : 0}%`} subtext="Successfully delivered" icon="✓" />
          <StatCard label="Avg Priority Score" value={backlog.length ? Math.round(backlog.reduce((a, b) => a + Number(b.priority_score), 0) / backlog.length) : 0} subtext="Kano weighted" icon="↗" />
          <StatCard label="Total Backlog Items" value={backlog.length} subtext="With feedback scores" icon="≡" subcolor="#64748b" />
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <SectionCard title="Status Breakdown" style={{ flex: 1 }}>
            <StatusBar label="To Do" count={sc.to_do || 0} total={total} />
            <StatusBar label="In Progress" count={sc.in_progress || 0} total={total} />
            <StatusBar label="Testing" count={sc.testing || 0} total={total} />
            <StatusBar label="Completed" count={sc.completed || 0} total={total} />
          </SectionCard>
          <SectionCard title="Kano Category Distribution" style={{ flex: 1 }}>
            {['must_be', 'one_dimensional', 'attractive', 'indifferent', 'reverse'].map(cat => {
              const count = backlog.filter(b => b.kano_category === cat).length;
              return <StatusBar key={cat} label={BacklogControl.getCategoryLabel(cat)} count={count} total={backlog.length} color={BacklogControl.getCategoryColor(cat)} />;
            })}
          </SectionCard>
        </div>
      </>
    );
  };

  const pages = { dashboard: renderDashboard, 'add-feature': renderAddFeature, backlog: renderBacklog, feedback: renderFeedback, kano: renderKano, assign: renderAssign, reports: renderReports };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {loading ? <Spinner /> : (pages[activePage] || renderDashboard)()}
    </Layout>
  );
}
