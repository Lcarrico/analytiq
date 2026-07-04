import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SCREEN_ROUTES } from './routes';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState({
    screen:        1,
    connectionId:  null,
    runId:         null,   // governance run
    sessionId:     null,
    pipelineRunId: null,
    artifactId:    null,
    // Quick-select metric (from Screen 06)
    selectedMetric: 'Net Revenue',
    selectedGrain:  'Location · Day',
  });

  const navigate = useNavigate();
  const update = (patch) => setState(s => ({ ...s, ...patch }));
  // R15S1E1: legacy nav(n) now drives the router (URL = source of truth)
  const nav = (screen) => {
    update({ screen });
    const route = SCREEN_ROUTES[screen];
    if (route) navigate(route);
  };

  return (
    <Ctx.Provider value={{ ...state, update, nav }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
