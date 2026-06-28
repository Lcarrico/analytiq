import { createContext, useContext, useState } from 'react';

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

  const update = (patch) => setState(s => ({ ...s, ...patch }));
  const nav    = (screen) => update({ screen });

  return (
    <Ctx.Provider value={{ ...state, update, nav }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
