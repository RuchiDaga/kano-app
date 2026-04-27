import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserControl, FeatureControl, FeedbackControl } from '../lib/supabase';
import Layout from '../components/layout/Layout';
import {
  StatCard, SectionCard, PageHeader, LoggedInBadge,
  PrimaryButton, SelectField, Badge, Spinner, EmptyState
} from '../components/ui';

// ECB Boundary: StakeholderUI
export default function StakeholderDashboard() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [features, setFeatures] = useState([]);
  const [myFeedback, setMyFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Feedback form state
  const [selectedFeatureId, setSelectedFeatureId] = useState('');
  const [kanoCategory, setKanoCategory] = useState('');
  const [functionalRating, setFunctionalRating] = useState(3);
  const [dysfunctionalRating, setDysfunctionalRating] = useState(3);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, [activePage]);

  async function loadData() {
    setLoading(true);
    try {
      const [s, f, fb] = await Promise.all([
        UserControl.getDashboardStats(user.id, user.role),
        FeatureControl.getAllFeatures(),
        FeedbackControl.getFeedbackByStakeholder(user.id)
      ]);
      setStats(s);
      setFeatures(f || []);
      setMyFeedback(fb || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSubmitFeedback() {
    if (!selectedFeatureId || !kanoCategory) { setMsg('Please select a feature and Kano category'); return; }
    setSubmitting(true);
    setMsg('');
    try {
      await FeedbackControl.submitFeedback(
        selectedFeatureId, user.id, kanoCategory,
        functionalRating, dysfunctionalRating, comment
      );
      setMsg('✅ Feedback submitted successfully!');
      setSelectedFeatureId(''); setKanoCategory(''); setComment('');
      setFunctionalRating(3); setDysfunctionalRating(3);
      loadData();
    } catch (e) { setMsg('❌ ' + e.message); }
    finally { setSubmitting(false); }
  }

  const KANO_CATEGORIES = [
    { value: 'must_be', label: 'Must-Be — Basic requirement' },
    { value: 'one_dimensional', label: 'One-Dimensional — More is better' },
    { value: 'attractive', label: 'Attractive — Unexpected delight' },
    { value: 'indifferent', label: 'Indifferent — Doesn\'t affect me' },
    { value: 'reverse', label: 'Reverse — Prefer not to have it' },
  ];

  const STATUS_LABELS = { to_do: 'To Do', in_progress: 'In Progress', testing: 'Testing', completed: 'Completed' };

  const renderDashboard = () => (
    <>
      <PageHeader title="Stakeholder Dashboard" subtitle="Provide feedback on proposed features" />
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Features" value={stats?.totalFeatures ?? 0} subtext="Available for review" icon="≡" subcolor="#64748b" />
        <StatCard label="My Responses" value={stats?.myResponses ?? 0} subtext="Feedback submitted" icon="✓" subcolor="#64748b" />
        <StatCard label="Pending Feedback" value={stats?.pendingFeedback ?? 0} subtext="Awaiting your input" icon="💬" subcolor="#f59e0b" />
        <StatCard label="Response Rate" value={`${stats?.responseRate ?? 0}%`} subtext="Completion percentage" icon="↗" />
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <SectionCard title="Recent Features" style={{ flex: 1.4 }}>
          {stats?.recentFeatures?.length ? stats.recentFeatures.map(f => (
            <div key={f.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{f.description?.slice(0,60)}…</div>
                </div>
              </div>
            </div>
          )) : <EmptyState message="No features yet" />}
        </SectionCard>
        <SectionCard title="My Recent Responses" style={{ flex: 1 }}>
          {stats?.recentResponses?.length ? stats.recentResponses.map(fb => (
            <div key={fb.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{fb.feature?.title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Submitted: {fb.created_at?.slice(0,10)}</div>
                </div>
              </div>
            </div>
          )) : <EmptyState message="No responses yet" />}
          <div style={{ marginTop: 12 }}><LoggedInBadge role={user.role} /></div>
        </SectionCard>
      </div>
    </>
  );

  const renderFeedback = () => {
    const pendingFeatures = features.filter(f => !myFeedback.find(fb => fb.request_id === f.id));
    return (
      <>
        <PageHeader title="Feature Feedback" subtitle="Rate features using the Kano Model" />
        {msg && <div style={{ background: msg.includes('✅') ? '#f0fdf4' : '#fef2f2', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, color: msg.includes('✅') ? '#16a34a' : '#ef4444' }}>{msg}</div>}

        <div style={{ display: 'flex', gap: 24 }}>
          <SectionCard title="Submit Feedback" style={{ flex: 1 }}>
            <SelectField label="Select Feature" value={selectedFeatureId} onChange={e => setSelectedFeatureId(e.target.value)}
              placeholder="Choose a feature to rate"
              options={pendingFeatures.map(f => ({ value: f.id, label: f.title }))} />

            <SelectField label="Kano Category" value={kanoCategory} onChange={e => setKanoCategory(e.target.value)}
              placeholder="Choose category" options={KANO_CATEGORIES} />

            {/* Kano Category Guide */}
            {kanoCategory && (
              <div style={{ background: '#eff0ff', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#6366f1' }}>
                {KANO_CATEGORIES.find(c => c.value === kanoCategory)?.label}
              </div>
            )}

            {/* Functional Rating */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: '#334155', marginBottom: 8 }}>
                Functional Rating (If this feature exists): <strong>{functionalRating}/5</strong>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setFunctionalRating(n)}
                    style={{ width: 40, height: 40, borderRadius: 8, border: `2px solid ${functionalRating === n ? '#6366f1' : '#e8eaf0'}`, background: functionalRating === n ? '#6366f1' : '#fff', color: functionalRating === n ? '#fff' : '#334155', fontWeight: 700, cursor: 'pointer' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Dysfunctional Rating */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: '#334155', marginBottom: 8 }}>
                Dysfunctional Rating (If this feature is absent): <strong>{dysfunctionalRating}/5</strong>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setDysfunctionalRating(n)}
                    style={{ width: 40, height: 40, borderRadius: 8, border: `2px solid ${dysfunctionalRating === n ? '#ef4444' : '#e8eaf0'}`, background: dysfunctionalRating === n ? '#ef4444' : '#fff', color: dysfunctionalRating === n ? '#fff' : '#334155', fontWeight: 700, cursor: 'pointer' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: '#334155', marginBottom: 6 }}>Comment (optional)</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Share your thoughts..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8eaf0', borderRadius: 8, fontSize: 13.5, color: '#334155', background: '#f8f9ff', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <PrimaryButton onClick={handleSubmitFeedback} disabled={submitting} variant="primary">
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </PrimaryButton>
          </SectionCard>

          <SectionCard title="Pending Features" style={{ flex: 1 }}>
            {pendingFeatures.length ? pendingFeatures.map(f => (
              <div key={f.id} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                onClick={() => setSelectedFeatureId(f.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{f.title}</div>
                  <Badge text={f.status?.replace('_', ' ')} category={f.status} />
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{f.description?.slice(0,80)}…</div>
              </div>
            )) : <EmptyState icon="✅" message="You've reviewed all features!" />}
          </SectionCard>
        </div>
      </>
    );
  };

  const renderResponses = () => (
    <>
      <PageHeader title="My Responses" subtitle="All feedback you've submitted" />
      <SectionCard>
        {myFeedback.length ? myFeedback.map(fb => (
          <div key={fb.id} style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{fb.feature?.title}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Submitted: {fb.created_at?.slice(0,10)}</div>
                {fb.comment && <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>"{fb.comment}"</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexDirection: 'column', alignItems: 'flex-end' }}>
                <Badge text={fb.kano_category?.replace('_', ' ')} category={fb.kano_category} />
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Func: {fb.functional_rating}/5 · Dysfunc: {fb.dysfunctional_rating}/5
                </div>
              </div>
            </div>
          </div>
        )) : <EmptyState message="No feedback submitted yet" />}
      </SectionCard>
    </>
  );

  const renderFeatures = () => (
    <>
      <PageHeader title="Feature List" subtitle="All features in the backlog" />
      <SectionCard>
        {features.map(f => {
          const hasResponded = myFeedback.find(fb => fb.request_id === f.id);
          return (
            <div key={f.id} style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasResponded ? '#10b981' : '#6366f1', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{f.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, marginLeft: 16 }}>{f.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <Badge text={f.status?.replace('_', ' ')} category={f.status} />
                  {hasResponded
                    ? <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>✓ Responded</span>
                    : <PrimaryButton variant="primary" onClick={() => { setSelectedFeatureId(f.id); setActivePage('feedback'); }} style={{ padding: '4px 12px', fontSize: 12 }}>Give Feedback</PrimaryButton>
                  }
                </div>
              </div>
            </div>
          );
        })}
        {!features.length && <EmptyState message="No features available" />}
      </SectionCard>
    </>
  );

  const pages = { dashboard: renderDashboard, feedback: renderFeedback, responses: renderResponses, features: renderFeatures };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {loading ? <Spinner /> : (pages[activePage] || renderDashboard)()}
    </Layout>
  );
}
