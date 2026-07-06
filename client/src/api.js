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
  goldTablesList:   ()      => get('/gold/tables'),                      // R36S1E1
  goldTableDetail:  (id)    => get(`/gold/tables/${id}`),                // R36S1E1
  contractsOverview: ()     => get('/contracts/overview'),               // R36S1E2
  alertRules:       ()     => get('/alert_rules'),                       // R36S1E3
  alertRule:        (id)   => get(`/alert_rules/${id}`),                 // R36S1E3
  createAlertRule:  (body) => post('/alert_rules', body),                // R36S1E3
  patchAlertRule:   (id, body) => patch(`/alert_rules/${id}`, body),     // R36S1E3
  deleteAlertRule:  (id)   => del(`/alert_rules/${id}`),                 // R36S1E3
  checkAlertRule:   (id)   => post(`/alert_rules/${id}/check`, {}),      // R36S1E3
  commentsInbox:    (tab)  => get(`/comments/inbox?tab=${tab}`),         // R36S2E1
  adminOverview:    ()     => get('/admin/overview'),                    // R36S2E2
  rolesMatrix:      ()     => get('/admin/roles'),                       // R36S2E2
  patchRolesMatrix: (body) => patch('/admin/roles', body),               // R36S2E2
  getPreferences: () => req('/settings/preferences'),
  putPreferences: (b) => req('/settings/preferences', { method: 'PUT', body: JSON.stringify(b) }),
  apiKeys: () => req('/keys'),
  createApiKey: (name) => req('/keys', { method: 'POST', body: JSON.stringify({ name }) }),
  revokeApiKey: (id) => req(`/keys/${id}`, { method: 'DELETE' }),
  componentRegistry: () => req('/component-registry'),
  previewComponent: (sid, body) => req(`/sessions/${sid}/component-query/preview`, { method: 'POST', body: JSON.stringify(body) }),
  createComponent: (sid, body) => req(`/sessions/${sid}/components`, { method: 'POST', body: JSON.stringify(body) }),
  deleteComponent: (sid, cid) => req(`/sessions/${sid}/components/${cid}`, { method: 'DELETE' }),
  duplicateComponent: (sid, cid) => req(`/sessions/${sid}/components/${cid}/duplicate`, { method: 'POST' }),
  specHead: (sid) => req(`/sessions/${sid}/dashboard-spec`),
  adminUsage: () => req('/admin/usage'),
  adminSecrets: () => req('/admin/secrets'),
  rotateSecret: (id) => req(`/admin/secrets/${id}/rotate`, { method: 'POST' }),
  auditLogs: (limit = 40) => req(`/audit-logs?limit=${limit}`),
  rlsPolicies: () => req('/admin/rls'),
  createRls: (body) => req('/admin/rls', { method: 'POST', body: JSON.stringify(body) }),
  simulateRls: (body) => req('/admin/rls/simulate', { method: 'POST', body: JSON.stringify(body) }),
  getSharing: () => req('/admin/sharing'),
  putSharing: (body) => req('/admin/sharing', { method: 'PUT', body: JSON.stringify(body) }),
  getSso:           ()     => get('/admin/sso'),                         // R36S2E3
  putSso:           (body) => put('/admin/sso', body),                   // R36S2E3
  testSso:          ()     => post('/admin/sso/test', {}),               // R36S2E3
  notifications:    ()      => get('/notifications'),
  readAllNotifications: ()  => post('/notifications/read_all', {}),
  postComment:      (id, body) => post(`/artifacts/${id}/comments`, body),
  getComments:      (id)    => get(`/artifacts/${id}/comments`).then(r => {
    // R30S3E6 — normalize the nested {comments:[{replies:[]}]} shape to a
    // flat list (drawer + pins share it)
    const roots = r.comments || [];
    return [...roots.map(({ replies, ...c }) => c),
            ...roots.flatMap(c => c.replies || [])];
  }),
  resolveComment:   (cid)   => post(`/comments/${cid}/resolve`, {}),    // R30S3E6
  teamRoster:       ()      => get('/team/roster'),
  createInvites:    (body)  => post('/team/invites', body),
  billingUsage:     ()      => get('/billing/usage'),
  billingOverview:  ()      => get('/billing/overview'),
  billingInvoices:  ()      => get('/billing/invoices'),
  billingPayments:  ()      => get('/billing/payment_methods'),
  putBillingPlan:   (plan)  => req('/billing/plan', { method: 'PUT', body: JSON.stringify({ plan }) }),
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
  reviewAction:     (id, body) => post(`/reviews/items/${id}`, body),   // R32S1E2
  getReviewItem:    (id)  => get(`/reviews/items/${id}`),               // R32S1E3
  getDqRules:       (cid) => get(`/dq/rules?connection_id=${cid}`),     // R32S1E4
  putDqRule:        (id, body) => put(`/dq/rules/${id}`, body),          // R32S1E4
  semanticSummary:  ()    => get('/semantic/default/summary'),          // R32S2E1
  semanticExplores: ()    => get('/semantic/default/explores'),         // R32S2E1
  semanticGenerate: (cid) => post('/semantic/default/generate', { connectionId: cid }),  // R32S2E1
  semanticConflicts: ()   => get('/semantic/default/conflicts'),        // R32S2E2
  createCalculatedMetric: (body) => post('/semantic/default/metrics/calculated', body),   // R32S2E2
  semanticPreview:  (body) => post('/semantic/default/preview', body),   // R32S2E3 (DEP bounded)
  modelsOverview:   ()     => get('/models/overview'),                   // R33S1E1
  dataSources:      ()     => get('/data/sources'),                      // R35S1E1
  dataSourceDetail: (id)   => get(`/data/sources/${id}`),                // R35S2E1
  tableDetail:      (rid, name) => get(`/data/tables/${rid}/${name}`),   // R35S2E2
  patchTableDetail: (rid, name, body) => patch(`/data/tables/${rid}/${name}`, body),  // R35S2E2
  previewScope:     (body) => post('/connections/preview_scope', body),  // R35S1E3
  pollConnection:   (id)   => post(`/connections/${id}/poll`, {}),       // R35S1E4
  webhookEvents:    (id)   => get(`/connections/${id}/events`),           // R35S1E4
  trainingJob:      (id)   => get(`/training/jobs/${id}`),               // R33S1E2
  featureManifests: (sid)  => get(`/feature_manifests?session_id=${sid}`), // R33S1E2
  featureManifest:  (id)   => get(`/feature_manifests/${id}`),           // R33S1E4
  retrainQueue:     ()     => get('/models/retrain_queue'),              // R33S1E4
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
  manifestVersionsDiffs: (id) => get(`/integrations/${id}/manifest/versions?diffs=1`),  // R32S1E6
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
  getArtifactVersions: (id) => get(`/artifacts/${id}/versions`),                  // R30S3E5
  restoreArtifactVersion: (id, v) => post(`/artifacts/${id}/versions/${v}/restore`, {}),
  createEmbedToken: (id, body) => post(`/artifacts/${id}/embed_tokens`, body),
  getEmbedSettings: (id)   => get(`/artifacts/${id}/embed_settings`),    // R33S2E2
  putEmbedSettings: (id, body) => put(`/artifacts/${id}/embed_settings`, body),  // R33S2E2
  scanInsights:     (id)    => post(`/artifacts/${id}/insights/scan`),
  insights:         (id)    => get(`/artifacts/${id}/insights`),
  dismissInsight:   (id)    => post(`/insights/${id}/dismiss`),
  drillInsight:     (id)    => post(`/insights/${id}/drill`),
  healthDashboard:  ()      => post('/workspace/health_dashboard'),
  putBranding:      (body)  => put('/branding', body),
  getBranding:      ()      => get('/branding'),
};