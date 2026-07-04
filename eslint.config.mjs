// R21S1E1-US2 — lint wall: the legacy `C` palette may not be imported by new
// code. Existing consumers are grandfathered below and retire per
// GAP_ANALYSIS_DESIGN_PARITY_CHECKLIST Appendix B (remove entries as stories
// delete each file; the wall then covers them too).
export default [
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs'],
    ignores: [
      '**/node_modules/**', '**/dist/**',
      // grandfathered C consumers (Appendix B retirement ledger):
      'client/src/components/Sidebar.jsx',
      'client/src/screens/NotFound.jsx',
      'client/src/screens/Placeholder.jsx',
      'client/src/screens/S02_Connect.jsx',
      'client/src/screens/S03_Governance.jsx',
      'client/src/screens/S04_TableHealth.jsx',
      'client/src/screens/S05_Semantic.jsx',
      'client/src/screens/S06_Analysis.jsx',
      'client/src/screens/S07_Confirm.jsx',
      'client/src/screens/S08_Pipeline.jsx',
      'client/src/screens/S09_Dashboard.jsx',
      'client/src/screens/S10_Artifacts.jsx',
      'client/src/screens/S11_Account.jsx',
      'client/src/screens/S12_Platform.jsx',
      'client/src/screens/S13_GovernanceOps.jsx',
      'client/src/screens/S14_Models.jsx',
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/tokens', '**/tokens.js'],
          importNames: ['C'],
          message: 'Legacy C palette is retired (R21S1E1-US2). Use P + T from tokens.js.',
        }],
      }],
    },
  },
];
