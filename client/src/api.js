const BASE = '/api';

export const auth = {
  token:   () => localStorage.getItem('analytiq_token'),
  user:    () => { try { return JSON.parse(localStorage.getItem('analytiq_user')); } catch { return null; } },
  save:    (token, user) => { localStorage.setItem('analytiq_token', token);
                              localStorage.setItem('analytiq_user', JSON.stringify(user)); },
  clear:   () => { localStorage.removeItem('analytiq_token');
                   localStorage.removeItem('analytiq_user'); },
};

async function req(path, opts = {}) {
  const token = auth.token();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const get  = (path)       => req(path);
const post = (path, body) => req(path, { method: 'POST', body: JSON.stringify(body) });
const put  = (path, body) => req(path, { method: 'PUT', body: JSON.stringify(body) });
const patch= (path, body) => req(path, { method: 'PATCH', body: JSON.stringify(body) });
const del  = (path)       => req(path, { method: 'DELETE' });

export const api = {
  // Health
  health:           ()      => get('/health'),

  // Connections
  homeSummary:      ()      => get('/home/summary'),   // R22S1E1
  getConnections:   ()      => get('/connections'),
  getConnection:    (id)    => get(`/connections/${id}`),
  createConnection: (body)  => post('/connections', body),
  testConnection:   (body)  => post('/connections/test', body),
  deleteConnection: (id)    => del(`/connections/${id}`),

  // Governance
  startGovernance:  (body)  => post('/governance/run', body),
  getGovernanceRun: (id)    => get(`/governance/${id}`),
  streamGovernance: (id)    => new EventSource(`${BASE}/governance/stream/${id}`),

  // Tables
  getTables:        (runId) => get(`/tables/${runId}`),

  // Semantic
  getSemantic:      (runId) => get(`/semantic/${runId}`),
  updateSemantic:   (id, b) => patch(`/semantic/${id}`, b),

  // Sessions
  createSession:    (body)  => post('/sessions', body),
  planSession:      (body)  => post('/sessions/plan', body),
  confirmSpec:      (id, body) => post(`/sessions/${id}/spec`, body),
  saveArtifactFromRun: async (runId, title) => {
    const run = await get(`/pipeline/${runId}`);
    return post(`/sessions/${run.session_id}/save_artifact`, { title });
  },
  getSession:       (id)    => get(`/sessions/${id}`),

  // Pipeline
  startPipeline:    (body)  => post('/pipeline/run', body),
  getPipelineRun:   (id)    => get(`/pipeline/${id}`),
  pipelineDag:      (id)    => get(`/pipeline/${id}/dag`),
  pipelineContracts: (id)   => get(`/pipeline/${id}/contracts`),
  goldCatalog:      ()      => get('/gold/catalog'),
  notifications:    ()      => get('/notifications'),
  readAllNotifications: ()  => post('/notifications/read_all', {}),
  postComment:      (id, body) => post(`/artifacts/${id}/comments`, body),
  teamRoster:       ()      => get('/team/roster'),
  createInvites:    (body)  => post('/team/invites', body),
  billingUsage:     ()      => get('/billing/usage'),
  observabilityReport: ()   => post('/workspace/observability_report', {}),
  streamPipeline:   (id)    => new EventSource(`${BASE}/pipeline/stream/${id}`),

  // Artifacts
  getArtifacts:     (params = {}) => {
    const sp = new URLSearchParams();
    if (params.q)         sp.set('q', params.q);
    if (params.type)      sp.set('type', params.type);
    if (params.dq_status) sp.set('dq_status', params.dq_status);
    if (params.sandbox)   sp.set('sandbox', '1');
    if (params.page)      sp.set('page', params.page);
    const qs = sp.toString();
    return get(`/artifacts${qs ? '?' + qs : ''}`);
  },
  getArtifact:      (id)    => get(`/artifacts/${id}`),
  renameArtifact:    (id, title) => patch(`/artifacts/${id}`, { title }),   // R30S1E4
  duplicateArtifact: (id)    => post(`/artifacts/${id}/duplicate`, {}),     // R30S1E4
  getWorkspaceStatus: ()    => get('/workspace/status'),
  createArtifact:   (body)  => post('/artifacts', body),
  deleteArtifact:   (id)    => del(`/artifacts/${id}`),
  getChartData:     (id)    => get(`/artifacts/${id}/chart`),
  exportUrl:        (id, fmt) => `${BASE}/artifacts/${id}/export?format=${fmt}`,
  getShares:        (id)    => get(`/artifacts/${id}/shares`),
  addShare:         (id, b) => post(`/artifacts/${id}/shares`, b),
  removeShare:      (id, shareId) => del(`/artifacts/${id}/shares/${shareId}`),

  // Schedules
  getSchedule:      (id)    => get(`/artifacts/${id}/schedule`),
  putSchedule:      (id, b) => put(`/artifacts/${id}/schedule`, b),
  deleteSchedule:   (id)    => del(`/artifacts/${id}/schedule`),
  // ── Auth (R1S1E1) ──
  register:         (body)  => post('/auth/register', body),
  login:            (body)  => post('/auth/login', body),
  me:               ()      => get('/auth/me'),
  // ── ACLs ──
  getAcl:           (rtype, rid)       => get(`/acl/${rtype}/${rid}`),
  putAcl:           (rtype, rid, body) => put(`/acl/${rtype}/${rid}`, body),
  // ── Platform (R1S2) ──
  platformStatus:   ()      => get('/platform/status'),
  platformJobs:     (q='')  => get(`/platform/jobs${q}`),
  platformLogs:     (n=50)  => get(`/platform/logs?limit=${n}`),
  platformMetrics:  ()      => get('/platform/metrics'),
  platformOutbox:   ()      => get('/platform/outbox'),
  platformCache:    ()      => get('/platform/cache'),
  platformDispatches: ()    => get('/platform/dispatches'),
  platformEvents:   (n=15)  => get(`/platform/events?limit=${n}`),
  emitEvent:        (body)  => post('/platform/events', body),
  metaDecisions:    ()      => get('/meta/decisions'),
  metaReprioritize: ()      => post('/meta/reprioritize', {}),
  agentConsultations: (n=15) => get(`/agents/consultations?limit=${n}`),
  promoteArtifact:  (id)    => post(`/artifacts/${id}/promote`, {}),
  runOptimizeScan:  ()      => post('/platform/optimize', {}),
  optimizations:    ()      => get('/platform/optimizations'),
  decideOptimization: (id, d) => post(`/platform/optimizations/${id}/${d}`, {}),
  listMemory:       (agent='') => get(`/memory${agent ? `?agent=${agent}` : ''}`),
  deleteMemory:     (id)    => del(`/memory/${id}`),
  kgRelated:        (metric) => get(`/kg/related?metric=${encodeURIComponent(metric)}`),
  warmStart:        ()      => get('/sessions/warm_start'),
  semanticEvolve:   ()      => post('/semantic/evolve', {}),
  semanticProposals: ()     => get('/semantic/proposals'),
  decideSemanticProposal: (id, d) => post(`/semantic/proposals/${id}/${d}`, {}),
  governanceLatest: ()      => get('/governance/latest'),
  reviewQueueRanked: (rid)  => get(`/reviews/${rid}?ranked=1`),
  reuseCandidates:  (metric) => get(`/reuse_candidates?metric=${encodeURIComponent(metric)}`),
  explainArtifact:  (id)    => get(`/artifacts/${id}/explain`),
  pipelineReplay:   (runId) => get(`/pipeline/${runId}/replay`),
  schemaVersions:   (ws='default') => get(`/semantic/${ws}/schema/versions`),
  artifactDiff:     (kind, a, b) => get(`/diff?kind=${kind}&a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`),
  artifactHealth:   (id)    => get(`/artifacts/${id}/health`),
  opportunities:    (id)    => get(`/artifacts/${id}/opportunities`),
  decideOpportunity: (id, d) => post(`/opportunities/${id}/${d}`, {}),
  platformFeedback: ()      => get('/platform/feedback'),
  selfImprove:      ()      => post('/platform/self_improve', {}),
  platformSignals:  ()      => get('/platform/signals'),
  monitorArtifact:  (id)    => post(`/artifacts/${id}/monitor`, {}),
  roiReport:        ()      => post('/workspace/roi_report', {}),
  search:           (q)     => get(`/search?q=${encodeURIComponent(q)}`),
  // ── Ingestion (R2) ──
  uploadFile:       (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const token = auth.token();
    return fetch(`${BASE}/uploads`, { method: 'POST', body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); });
  },
  pollSource:       (id)    => post(`/connections/${id}/poll`),
  getEvents:        (id)    => get(`/connections/${id}/events`),
  dbtImport:        (id, manifest) => post(`/integrations/${id}/dbt_import`, manifest),
  runProfile:       (id)    => post(`/connections/${id}/profile`),
  // ── Governance depth (R3S1) ──
  getManifest:      (id, v) => get(`/integrations/${id}/manifest${v ? `?version=${v}` : ''}`),
  manifestVersions: (id)    => get(`/integrations/${id}/manifest/versions`),
  rollbackManifest: (id, version) => post(`/integrations/${id}/manifest/rollback`, { version }),
  approvePii:       (id, body)    => post(`/integrations/${id}/manifest/approve_pii`, body),
  healthHistory:    (id, table)   => get(`/integrations/${id}/health_history${table ? `?table=${table}` : ''}`),
  setThreshold:     (body)  => put('/governance/thresholds', body),
  setSla:           (body)  => put('/tables/sla', body),
  getSlas:          (id)    => get(`/tables/sla?connection_id=${id}`),
  setContract:      (body)  => put('/contracts', body),
  getContracts:     (id)    => get(`/contracts?connection_id=${id}`),
  getAlerts:        (type)  => get(`/alerts${type ? `?type=${type}` : ''}`),
  getDrift:         (id)    => get(`/integrations/${id}/drift`),
  createDqTest:     (body)  => post('/dq/tests', body),
  getDqTests:       (id)    => get(`/dq/tests?connection_id=${id}`),
  runDqTests:       (id)    => post(`/dq/tests/run?connection_id=${id}`),
  dqEvaluate:       (body)  => post('/dq/evaluate', body),
  getLineage:       (id)    => get(`/lineage/${id}`),
  // ── Semantic depth (R3S2) ──
  getSchema:        (v)     => get(`/semantic/default/schema${v ? `?version=${v}` : ''}`),
  schemaVersions:   ()      => get('/semantic/default/schema/versions'),
  schemaDiff:       (f, t)  => get(`/semantic/default/schema/diff?from=${f}&to=${t}`),
  schemaImpacts:    (f, t)  => get(`/semantic/default/impacts?from=${f}&to=${t}`),
  generateSchema:   (cid)   => post('/semantic/default/generate', { connectionId: cid }),
  createCalcMetric: (body)  => post('/semantic/default/metrics/calculated', body),
  getPdts:          ()      => get('/semantic/default/pdts'),
  createPdt:        (body)  => post('/semantic/default/pdts', body),
  refreshPdt:       (name)  => post(`/semantic/default/pdts/${name}/refresh`),
  preaggRecs:       ()      => get('/semantic/default/preagg_recommendations'),
  // ── Sessions (R4S1) ──
  listSessions:     ()      => get('/sessions'),
  forkSession:      (id, body) => post(`/sessions/${id}/fork`, body),
  sessionMessageUrl:(id)    => `${BASE}/sessions/${id}/message`,
  sessionEvents:    (id)    => get(`/sessions/${id}/events`),
  suggestions:      (id)    => get(`/sessions/${id}/suggestions`),
  templates:        ()      => get('/templates'),
  createTemplate:   (body)  => post('/templates', body),
  fromTemplate:     (id, body) => post(`/sessions/from_template/${id}`, body),
  pipelineSteps:    (id)    => get(`/pipeline/${id}/steps`),
  flagStep:         (id, step, reason) => post(`/pipeline/${id}/steps/${step}/flag`, { reason }),
  // ── Modeler & FE (R4S2/R5) ──
  modelerGenerate:  (body)  => post('/modeler/generate', body),
  modelerEnrich:    (sid)   => post('/modeler/enrich', { sessionId: sid }),
  goldTables:       (sid)   => get(`/modeler/gold/${sid}`),
  customFeatures:   (body)  => post('/modeler/custom_features', body),
  approveFeature:   (id)    => post(`/modeler/custom_features/${id}/approve`),
  applyFeature:     (id)    => post(`/modeler/custom_features/${id}/apply`),
  confirmLeakage:   (body)  => post('/modeler/leakage/confirm', body),
  // ── Training / registry (R5) ──
  trainRun:         (sid)   => post('/training/run', { sessionId: sid }),
  trainingJobs:     (sid)   => get(`/training/jobs${sid ? `?session_id=${sid}` : ''}`),
  trainingJob:      (id)    => get(`/training/jobs/${id}`),
  jobTrials:        (id)    => get(`/training/jobs/${id}/trials`),
  modelCards:       (sid)   => get(`/model_cards${sid ? `?session_id=${sid}` : ''}`),
  modelCard:        (id)    => get(`/model_cards/${id}`),
  promote:          (jobId) => post(`/training/jobs/${jobId}/promote`),
  trainingResult:   (sid)   => get(`/training/result/${sid}`),
  registryModels:   (sid)   => get(`/registry/models${sid ? `?session_id=${sid}` : ''}`),
  archiveModel:     (id)    => post(`/registry/models/${id}/archive`),
  registerChallenger:(body) => post('/registry/challenger', body),
  evaluateChallenger:(id)   => post(`/registry/challenger/${id}/evaluate`),
  retrain:          (sid)   => post(`/models/${sid}/retrain`),
  // ── Artifacts polish (R6/R7) ──
  renderArtifact:   (id)    => post(`/artifacts/${id}/render`),
  refreshArtifact:  (id)    => post(`/artifacts/${id}/refresh`),
  artifactDrift:    (id)    => get(`/artifacts/${id}/drift`),
  toggleFavorite:   (id)    => post(`/artifacts/${id}/favorite`),
  putTags:          (id, tags) => put(`/artifacts/${id}/tags`, { tags }),
  activity:         (id)    => get(`/artifacts/${id}/activity`),
  provenance:       (id)    => get(`/artifacts/${id}/provenance`),
  artifactChart:    (id)    => get(`/artifacts/${id}/chart`),
  editSection:      (id, sid, body) => req(`/artifacts/${id}/sections/${sid}`, { method: 'PATCH', body: JSON.stringify(body) }),
  annotations:      (id)    => get(`/artifacts/${id}/annotations`),
  addAnnotation:    (id, body) => post(`/artifacts/${id}/annotations`, body),
  addSubscription:  (id, body) => post(`/artifacts/${id}/subscriptions`, body),
  createShareLink:  (id, body) => post(`/artifacts/${id}/share_links`, body),
  revokeShareLinks: (id)    => post(`/artifacts/${id}/share_links/revoke`, {}),   // R30S3E4
  createEmbedToken: (id, body) => post(`/artifacts/${id}/embed_tokens`, body),
  scanInsights:     (id)    => post(`/artifacts/${id}/insights/scan`),
  insights:         (id)    => get(`/artifacts/${id}/insights`),
  dismissInsight:   (id)    => post(`/insights/${id}/dismiss`),
  drillInsight:     (id)    => post(`/insights/${id}/drill`),
  healthDashboard:  ()      => post('/workspace/health_dashboard'),
  putBranding:      (body)  => put('/branding', body),
  getBranding:      ()      => get('/branding'),
};