import { AppProvider, useApp } from './context';
import { AuthProvider, useAuth } from './auth';
import Sidebar from './components/Sidebar';
import Login from './screens/Login';
import Screen01 from './screens/S01_Home';
import Screen02 from './screens/S02_Connect';
import Screen03 from './screens/S03_Governance';
import Screen04 from './screens/S04_TableHealth';
import Screen05 from './screens/S05_Semantic';
import Screen06 from './screens/S06_Analysis';
import Screen07 from './screens/S07_Confirm';
import Screen08 from './screens/S08_Pipeline';
import Screen09 from './screens/S09_Dashboard';
import Screen10 from './screens/S10_Artifacts';

const SCREENS = {
  1:  Screen01,
  2:  Screen02,
  3:  Screen03,
  4:  Screen04,
  5:  Screen05,
  6:  Screen06,
  7:  Screen07,
  8:  Screen08,
  9:  Screen09,
  10: Screen10,
};

function Layout() {
  const { screen } = useApp();
  const Screen = SCREENS[screen] || Screen01;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: '#f4f6fb' }}>
        <Screen />
      </main>
    </div>
  );
}

function AuthGate() {
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb' }}>
        <div style={{ color: '#9ca3af', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}

export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; font-family: 'IBM Plex Sans', sans-serif; background: #f4f6fb; }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        input, textarea, select, button { font-family: 'IBM Plex Sans', sans-serif; }
        a { color: inherit; text-decoration: none; }
      `}</style>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </>
  );
}
