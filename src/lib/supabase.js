import { createClient } from '@supabase/supabase-js';

// ⚠️ REPLACE THESE TWO VALUES WITH YOUR ACTUAL KEYS
const SUPABASE_URL = 'https://pklfyrkqmwbkxulaxtek.supabase.co';
const SUPABASE_KEY = 'sb_publishable_C1RkIhLFRe2RzbkfXINS3A_46FriPfQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const AuthenticationControl = {
  async signIn(email, password, role) {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw new Error('Database error: ' + error.message);
    if (!data || data.length === 0) throw new Error('No users in database');
    const user = data.find(u =>
      u.email.toLowerCase().trim() === email.toLowerCase().trim() &&
      u.role === role
    );
    if (!user) throw new Error('No account found with this email and role combination');
    if (password !== 'password123') throw new Error('Wrong password. Use: password123');
    const session = { user, token: btoa(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 86400000 })) };
    localStorage.setItem('kano_session', JSON.stringify(session));
    return session;
  },
  async signOut() { localStorage.removeItem('kano_session'); },
  getSession() {
    const raw = localStorage.getItem('kano_session');
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      const payload = JSON.parse(atob(session.token));
      if (payload.exp < Date.now()) { localStorage.removeItem('kano_session'); return null; }
      return session;
    } catch { return null; }
  },
  getCurrentUser() { const s = this.getSession(); return s?.user || null; }
};

export const FeatureControl = {
  async getAllFeatures() {
    const { data, error } = await supabase.from('feature_requests').select(`*, submitter:submitted_by(name, email), assignee:assigned_to(name, email)`).order('created_at', { ascending: false });
    if (error) throw error; return data || [];
  },
  async createFeature(title, description, userId) {
    if (!title?.trim()) throw new Error('Title is required');
    if (!description?.trim()) throw new Error('Description is required');
    const { data, error } = await supabase.from('feature_requests').insert({ title: title.trim(), description: description.trim(), submitted_by: userId, status: 'to_do' }).select().single();
    if (error) throw error; return data;
  },
  async updateFeatureStatus(featureId, status) {
    const { data, error } = await supabase.from('feature_requests').update({ status }).eq('id', featureId).select().single();
    if (error) throw error; return data;
  },
  async assignFeature(featureId, devUserId) {
    const { data, error } = await supabase.from('feature_requests').update({ assigned_to: devUserId }).eq('id', featureId).select().single();
    if (error) throw error; return data;
  },
  async getFeaturesByAssignee(userId) {
    const { data, error } = await supabase.from('feature_requests').select('*').eq('assigned_to', userId).order('created_at', { ascending: false });
    if (error) throw error; return data || [];
  }
};

export const FeedbackControl = {
  async submitFeedback(requestId, stakeholderId, kanoCategory, functionalRating, dysfunctionalRating, comment) {
    const { data, error } = await supabase.from('feedback').upsert({ request_id: requestId, stakeholder_id: stakeholderId, kano_category: kanoCategory, functional_rating: functionalRating, dysfunctional_rating: dysfunctionalRating, comment }, { onConflict: 'request_id,stakeholder_id' }).select().single();
    if (error) throw error;
    await BacklogControl.recalculateScore(requestId);
    return data;
  },
  async getFeedbackByStakeholder(stakeholderId) {
    const { data, error } = await supabase.from('feedback').select(`*, feature:request_id(title, description, status)`).eq('stakeholder_id', stakeholderId).order('created_at', { ascending: false });
    if (error) throw error; return data || [];
  },
  async getFeedbackByFeature(requestId) {
    const { data, error } = await supabase.from('feedback').select(`*, stakeholder:stakeholder_id(name, email)`).eq('request_id', requestId);
    if (error) throw error; return data || [];
  },
  async hasStakeholderResponded(requestId, stakeholderId) {
    const { data } = await supabase.from('feedback').select('id').eq('request_id', requestId).eq('stakeholder_id', stakeholderId).single();
    return !!data;
  }
};

export const BacklogControl = {
  WEIGHTS: { must_be: 100, one_dimensional: 75, attractive: 50, indifferent: 10, reverse: 0 },
  async recalculateScore(requestId) {
    const { data, error } = await supabase.rpc('calculate_kano_score', { p_request_id: requestId });
    if (error) console.error('Score calc error:', error); return data;
  },
  async getBacklog() {
    const { data, error } = await supabase.from('backlog').select(`*, feature:request_id(id, title, description, status, created_at)`).order('priority_score', { ascending: false });
    if (error) throw error; return data || [];
  },
  async getKanoAnalysis() {
    const { data, error } = await supabase.from('backlog').select(`kano_category, priority_score, feedback_count, feature:request_id(title, status)`);
    if (error) throw error;
    const summary = { must_be: 0, one_dimensional: 0, attractive: 0, indifferent: 0, reverse: 0 };
    data?.forEach(item => { if (summary[item.kano_category] !== undefined) summary[item.kano_category]++; });
    return { items: data || [], summary };
  },
  getCategoryLabel(category) {
    return { must_be: 'Must-Be', one_dimensional: 'One-Dimensional', attractive: 'Attractive', indifferent: 'Indifferent', reverse: 'Reverse' }[category] || category;
  },
  getCategoryColor(category) {
    return { must_be: '#ef4444', one_dimensional: '#6366f1', attractive: '#10b981', indifferent: '#94a3b8', reverse: '#f59e0b' }[category] || '#94a3b8';
  }
};

export const UserControl = {
  async getDevTeamMembers() {
    const { data, error } = await supabase.from('users').select('id, name, email, role').eq('role', 'dev_team');
    if (error) throw error; return data || [];
  },
  async getDashboardStats(userId, role) {
    const features = await FeatureControl.getAllFeatures();
    const statusCount = { to_do: 0, in_progress: 0, testing: 0, completed: 0 };
    features.forEach(f => { if (statusCount[f.status] !== undefined) statusCount[f.status]++; });
    if (role === 'product_manager') {
      const backlog = await BacklogControl.getBacklog();
      return { totalFeatures: features.length, awaitingFeedback: features.filter(f => !backlog.find(b => b.request_id === f.id)).length, highPriority: backlog.filter(b => b.priority_score >= 80).length, completed: statusCount.completed, statusCount, recentFeatures: features.slice(0, 5) };
    }
    if (role === 'dev_team') {
      const assigned = features.filter(f => f.assigned_to === userId);
      const inProgress = assigned.filter(f => f.status === 'in_progress').length;
      const completed = assigned.filter(f => f.status === 'completed').length;
      return { totalAssigned: assigned.length, inProgress, completed, upcoming: assigned.filter(f => f.status === 'to_do').length, statusCount: { to_do: assigned.filter(f => f.status === 'to_do').length, in_progress: inProgress, testing: assigned.filter(f => f.status === 'testing').length, completed }, assignedFeatures: assigned };
    }
    if (role === 'stakeholder') {
      const myFeedback = await FeedbackControl.getFeedbackByStakeholder(userId);
      return { totalFeatures: features.length, myResponses: myFeedback.length, pendingFeedback: features.length - myFeedback.length, responseRate: features.length > 0 ? Math.round((myFeedback.length / features.length) * 100) : 0, recentFeatures: features.slice(0, 5), recentResponses: myFeedback.slice(0, 3) };
    }
  }
};