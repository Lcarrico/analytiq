"""R40S1E1 (deep-dive F-04 / §6 grid behavior) — grid mutation semantics.

Deterministic invariants after EVERY mutation:
  · every cell fits the 12-column grid (x ≥ 0, w ≥ 1, x + w ≤ 12, y ≥ 0)
  · no two cells overlap (later/lower cells push down to resolve)
  · vertical gaps compact (cells fall up until they rest on another cell)
Locked cells keep their geometry; movers resolve around them.
"""
GRID_COLS = 12


def _clamp(cell):
    w = max(1, min(int(cell.get('w', 1)), GRID_COLS))
    x = max(0, min(int(cell.get('x', 0)), GRID_COLS - w))
    y = max(0, int(cell.get('y', 0)))
    h = max(1, int(cell.get('h', 1)))
    return {**cell, 'x': x, 'y': y, 'w': w, 'h': h}


def _overlap(a, b):
    return (a['x'] < b['x'] + b['w'] and b['x'] < a['x'] + a['w']
            and a['y'] < b['y'] + b['h'] and b['y'] < a['y'] + a['h'])


def normalize(cells):
    """Clamp → resolve collisions (stable order: locked first, then y/x/id) →
    compact vertical gaps. Locked cells never move; movers resolve around
    them (R40S1E3). Same input, same output."""
    cells = [_clamp(dict(c)) for c in cells]
    cells.sort(key=lambda c: (0 if c.get('locked') else 1,
                              c['y'], c['x'], str(c.get('component_id'))))
    placed = []
    for c in cells:
        if not c.get('locked'):
            while any(_overlap(c, p) for p in placed):
                c['y'] += 1                      # push down until free
        placed.append(c)
    # compact: unlocked cells rise until they would collide
    placed.sort(key=lambda c: (c['y'], c['x'], str(c.get('component_id'))))
    for i, c in enumerate(placed):
        if c.get('locked'):
            continue
        while c['y'] > 0:
            trial = {**c, 'y': c['y'] - 1}
            if any(_overlap(trial, p) for j, p in enumerate(placed) if j != i):
                break
            c['y'] -= 1
    return placed


def apply_grid_patch(spec, breakpoint, cells):
    """Replace one breakpoint's layout with the normalized geometry.
    Raises ValueError for unknown components/breakpoints."""
    from dashboard_spec import BREAKPOINTS
    if breakpoint not in BREAKPOINTS:
        raise ValueError(f'breakpoint must be one of {BREAKPOINTS}')
    known = {c['id'] for c in spec.get('components', [])}
    bad = [c.get('component_id') for c in cells if c.get('component_id') not in known]
    if bad:
        raise ValueError(f'unknown component(s): {bad}')
    spec.setdefault('grid', {})[breakpoint] = normalize(cells)
    return spec
