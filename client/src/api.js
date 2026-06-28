const BASE = '/api';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts.headers },
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
const patch= (path, body) => req(path, { method: 'PATCH', body: JSON.stringify(body) });
const del  = (path)       => req(path, { method: 'DELETE' });

export const api = {
  // Auth
  authLogin:        (body)  => post('/auth/login', body),
  authRegister:     (body)  => post('/auth/register', body),
  authLogout:       ()      => post('/auth/logout', {}),
  authMe:           ()      => get('/auth/me'),

  // Health
  health:           ()      => get('/health'),

  // Connections
  getConnections:   ()      => get('/connections'),
  getConnection:    (id)    => get(`/connections/${id}`),
  createConnection: (body)  => post('/connections', body),

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
  getSession:       (id)    => get(`/sessions/${id}`),

  // Pipeline
  startPipeline:    (body)  => post('/pipeline/run', body),
  getPipelineRun:   (id)    => get(`/pipeline/${id}`),
  streamPipeline:   (id)    => new EventSource(`${BASE}/pipeline/stream/${id}`),

  // Artifacts
  getArtifacts:     ()      => get('/artifacts'),
  getArtifact:      (id)    => get(`/artifacts/${id}`),
  createArtifact:   (body)  => post('/artifacts', body),
  deleteArtifact:   (id)    => del(`/artifacts/${id}`),
  getChartData:     (id)    => get(`/artifacts/${id}/chart`),
  getShares:        (id)    => get(`/artifacts/${id}/shares`),
  addShare:         (id, b) => post(`/artifacts/${id}/shares`, b),
  removeShare:      (id, shareId) => del(`/artifacts/${id}/shares/${shareId}`),
};
