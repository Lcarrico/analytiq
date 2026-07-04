// R15S1E2: labeled placeholders for areas that arrive with later releases.
import { C, FONT, MONO } from '../tokens';

export default function Placeholder({ title, note }) {
  return (
    <div data-testid="placeholder-page" style={{ maxWidth: 560, margin: '72px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: C.text }}>{title}</div>
      <div style={{ fontSize: 13, fontFamily: FONT, color: C.textSec, marginTop: 8 }}>{note}</div>
      <div style={{ fontSize: 11, fontFamily: MONO, color: C.textTer, marginTop: 14 }}>
        UI-PRD gap program · RELEASE_PLAN.md
      </div>
    </div>
  );
}
