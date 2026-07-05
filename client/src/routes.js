// R15S1E1: screen ↔ route map (PRD v3 information architecture).
// Legacy wizard screens become route bodies; later releases replace them.
export const SCREEN_ROUTES = {
  1: '/app',
  2: '/app/data/sources',
  3: '/app/data/run',
  4: '/app/data/health',
  6: '/app/create/quick',   // R16S1E1: workbench owns /app/create
  7: '/app/create/confirm',
  8: '/app/create/run',
  9: '/app/create/result',
  10: '/app/artifacts',
  11: '/app/settings/profile',
  12: '/app/admin/platform',
  13: '/app/governance',
  14: '/app/models',
};

export const ROUTE_SCREENS = Object.fromEntries(
  Object.entries(SCREEN_ROUTES).map(([n, path]) => [path, Number(n)]));
