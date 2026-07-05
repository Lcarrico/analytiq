import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context';
import Shell from './components/Shell';
import NotFound from './screens/NotFound';
import Placeholder from './screens/Placeholder';
import Workbench from './screens/Workbench';
import GoldCatalog from './screens/GoldCatalog';
import KitGallery from './screens/KitGallery';  // R21S1E2
import Home from './screens/Home';               // R22S1E1
import Activity from './screens/Activity';       // R31S2E1
import Governance from './screens/Governance';   // R32S1E1
import GovernanceReview from './screens/GovernanceReview';
import GovernanceDiff from './screens/GovernanceDiff';
import GovernanceRules from './screens/GovernanceRules';   // R32S1E2
import Team from './screens/Team';
import PublicViewer from './screens/PublicViewer';
import Billing from './screens/Billing';
import { Landing, Pricing } from './screens/Marketing';
import { ForgotPassword, Login, Register, SsoCallback, VerifyEmail } from './screens/Auth';   // R31S1E1/E2 — standalone
import { OnboardingSourceHealth, OnboardingStart, OnboardingTemplates, OnboardingWorkspace } from './screens/Onboarding';   // R31S1E3
import { Forbidden, useRole } from './components/roles';
import { ROUTE_SCREENS } from './routes';
import Screen02 from './screens/S02_Connect';
import Screen03 from './screens/S03_Governance';
import Screen04 from './screens/S04_TableHealth';
import Screen05 from './screens/S05_Semantic';
// R30S3E7: S06–S09 retired — the workbench owns the whole loop
import Artifacts from './screens/Artifacts';   // R30S1E2
import ArtifactDetail from './screens/ArtifactDetail';   // R30S1E4
import Screen11 from './screens/S11_Account';
import Screen12 from './screens/S12_Platform';
import Screen13 from './screens/S13_GovernanceOps';
import Screen14 from './screens/S14_Models';

const SCREENS = {
  2:  Screen02,
  3:  Screen03,
  4:  Screen04,
  5:  Screen05,
  10: Artifacts,   // R30S1E2 — Frame 01 library (cards + rail + ⋯ menus)
  11: Screen11,
  12: Screen12,
  13: Screen13,
  14: Screen14,
};

// R16S1E1: numeric session ids get the workbench; named legacy child routes
// (quick/confirm/run/result) fall through to the wizard screens.
function WorkbenchGuard() {
  // one Route pattern for new + numeric ids keeps the workbench mounted
  // across the new→session navigation (chat state survives). R30S3E7: the
  // named wizard children retired — quick/confirm/run land on the workbench
  // start state; result lands on the artifacts library.
  const { pathname } = useLocation();
  const seg = pathname.split('/').pop();
  if (seg === 'new' || /^\d+$/.test(seg)) return <Workbench />;
  if (seg === 'result') return <Navigate to="/app/artifacts" replace />;
  if (['quick', 'confirm', 'run'].includes(seg)) {
    return <Navigate to="/app/create/new" replace />;
  }
  return <ScreenAt />;
}

const ADMIN_ROUTES = ['/app/admin/platform', '/app/governance', '/app/billing'];

function ScreenAt() {
  const role = useRole();
  // R15S1E1: the URL is the source of truth; context.screen mirrors it so
  // legacy screen code (Sidebar active state, wizard logic) keeps working.
  const { pathname } = useLocation();
  const { screen, update } = useApp();
  const target = ROUTE_SCREENS[pathname];
  const blocked = role !== 'admin' && ADMIN_ROUTES.includes(pathname);
  useEffect(() => {
    if (target && target !== screen) update({ screen: target });
  }, [target]);
  if (blocked) return <Forbidden />;
  const Screen = SCREENS[target] || NotFound;
  return <Screen />;
}

// R15S1E2: placeholder routes for areas arriving with later releases
const PLACEHOLDERS = {
  '/app/alerts': ['Alerts', 'The alerts center (rules, mutes, delivery tracking) arrives with the people layer (R18).'],
};

function Layout() {
  return (
    <Shell>
      <Routes>
        <Route path="/app" element={<Home />} />  {/* R22S1E1 — replaces S01 */}
        <Route path="/app/activity" element={<Activity />} />  {/* R31S2E1 */}
        <Route path="/app/governance" element={<Governance />} />  {/* R32S1E1 — admin-gated in-component */}
        <Route path="/app/governance/review" element={<GovernanceReview />} />  {/* R32S1E2 */}
        <Route path="/app/governance/review/:id" element={<GovernanceDiff />} />  {/* R32S1E3 */}
        <Route path="/app/governance/rules" element={<GovernanceRules />} />  {/* R32S1E4 */}
        <Route path="/app/create" element={<Navigate to="/app/create/new" replace />} />
        <Route path="/app/gold" element={<GoldCatalog />} />
        <Route path="/app/__kit" element={<KitGallery />} />  {/* R21S1E2 gallery */}
        <Route path="/app/team" element={<Team />} />
        <Route path="/app/billing" element={<Billing />} />
        <Route path="/app/create/:sessionId" element={<WorkbenchGuard />} />
        <Route path="/app/artifacts/:id" element={<ArtifactDetail />} />  {/* R30S1E4 */}
        {Object.entries(PLACEHOLDERS).map(([path, [title, note]]) => (
          <Route key={path} path={path} element={<Placeholder title={title} note={note} />} />
        ))}
        <Route path="*" element={<ScreenAt />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; font-family: 'IBM Plex Sans', sans-serif; background: #f7f8fa; }  /* R21S2E3 */
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4d9e1; border-radius: 3px; }
        input, textarea, select, button { font-family: 'IBM Plex Sans', sans-serif; }
        a { color: inherit; text-decoration: none; }
      `}</style>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />       {/* R31S1E1 */}
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />  {/* R31S1E2 */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/sso/callback" element={<SsoCallback />} />
          <Route path="/onboarding/workspace" element={<OnboardingWorkspace />} />  {/* R31S1E3 */}
          <Route path="/onboarding/start" element={<OnboardingStart />} />
          <Route path="/onboarding/source-health" element={<OnboardingSourceHealth />} />
          <Route path="/onboarding/templates" element={<OnboardingTemplates />} />
          <Route path="/share/:token" element={<PublicViewer />} />
          <Route path="*" element={<Layout />} />
        </Routes>
      </AppProvider>
    </>
  );
}
