#!/usr/bin/env python3
"""
Design-parity inventory extractor (PAR-1).

Parses every mockup in docs/specs/mockups/*.dc.html into
tests/ui/parity/inventory.json:

  { "frames": [ { file, frame, name, route,
                  labels:  [structural component labels],
                  tabs:    [tab-strip labels],
                  links:   [{text, target_route}] } ] }

Extraction rules (the frame IS the spec):
- a "label" is text styled as a component identifier: uppercase mono
  micro-labels, or short bold (600/700) titles/buttons — i.e. structure,
  not demo data. Digit-bearing strings and known demo-narrative titles are
  dropped so data-driven screens aren't punished for having real data.
- a "tab" is a sibling of the active-tab element (border-bottom 2px accent).
- a "link" is an <a href="<Other>.dc.html[#frame]"> — resolved to the target
  frame's route so page-to-page flows can be asserted.
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
MOCKS = ROOT / 'docs' / 'specs' / 'mockups'
OUT = Path(__file__).with_name('inventory.json')

DEMO_RE = re.compile(
    r'Q3 |Northeast|SKU|rev_loc|GOLD\.|POS feed|discount_pct|zip4|Churn|'
    r'Margin variance|Inventory Demand|Marketing Spend|SLA Breach|'
    r'Location Performance|Weekly ops|Dana|Priya|Marcus|acme-retail|'
    r'wms_events|orders|customers|snowflake_prod|Revenue Forecast|'
    r'active_customer|promo|weather', re.I)
DIGIT_RE = re.compile(r'\d')
ALPHA_RE = re.compile(r'[A-Za-z]{2}')

ACTIVE_TAB_RE = re.compile(r'border-bottom:\s*2px solid #2563eb')
BOLD_RE = re.compile(r'font-weight:\s*(600|650|700)')
UPPER_RE = re.compile(r'text-transform:\s*uppercase')

class Node:
    __slots__ = ('tag', 'attrs', 'children', 'text', 'parent')
    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent = tag, dict(attrs), parent
        self.children, self.text = [], ''

class TreeParser(HTMLParser):
    VOID = {'br', 'img', 'input', 'hr', 'meta', 'link', 'rect', 'path',
            'circle', 'ellipse', 'polyline', 'polygon', 'line'}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('root', [], None)
        self.cur = self.root
        self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.skip += 1
            return
        n = Node(tag, attrs, self.cur)
        self.cur.children.append(n)
        if tag not in self.VOID:
            self.cur = n
    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip = max(0, self.skip - 1)
            return
        c = self.cur
        while c is not self.root and c.tag != tag:
            c = c.parent
        if c is not self.root:
            self.cur = c.parent
    def handle_data(self, data):
        if not self.skip and data.strip():
            self.cur.text += data.strip() + ' '

def own_text(n):
    return re.sub(r'\s+', ' ', n.text).strip()

def full_text(n):
    parts = [own_text(n)]
    for c in n.children:
        parts.append(full_text(c))
    return re.sub(r'\s+', ' ', ' '.join(p for p in parts if p)).strip()

def walk(n):
    yield n
    for c in n.children:
        yield from walk(c)

SNAKE_RE = re.compile(r'\b[a-z]+_[a-z0-9_]+\b')
NOISE = {'Analyt', 'IQ', 'met'}

def keep_label(text, style):
    if text in NOISE or SNAKE_RE.search(text) or ' · ' in text:
        return False
    if not (2 <= len(text) <= 42) or not ALPHA_RE.search(text):
        return False
    if len(text.split()) > 5:
        return False
    if DIGIT_RE.search(text) or DEMO_RE.search(text):
        return False
    if not (BOLD_RE.search(style) or UPPER_RE.search(style)):
        return False
    return True

def frame_route(label):
    m = re.search(r'(/[\w/\-:*]*)\s*$', label or '')
    return m.group(1) if m else None

CHROME_LINKS = {'Home', 'Create', 'Artifacts', 'Data', 'Semantic Layer',
                'Gold Tables', 'Models', 'Alerts', 'Governance', 'Team', 'Admin',
                'Billing', 'Settings', 'AnalytIQ', 'Analyt IQ', 'Collapse'}

def main():
    frames_out = []
    seen_links_global = set()
    route_by_file_frame = {}
    parsed = {}
    for f in sorted(MOCKS.glob('*.dc.html')):
        tp = TreeParser()
        tp.feed(f.read_text(encoding='utf-8', errors='ignore'))
        parsed[f.name] = tp.root
        for n in walk(tp.root):
            if n.tag == 'section' and 'id' in n.attrs:
                r = frame_route(n.attrs.get('data-screen-label', ''))
                route_by_file_frame[(f.name, n.attrs['id'])] = r
                route_by_file_frame.setdefault((f.name, None), r)  # first frame default

    for f in sorted(MOCKS.glob('*.dc.html')):
        root = parsed[f.name]
        for sec in walk(root):
            if sec.tag != 'section' or 'id' not in sec.attrs:
                continue
            label = sec.attrs.get('data-screen-label', sec.attrs['id'])
            route = frame_route(sec.attrs.get('data-screen-label', ''))
            labels, tabs, links = [], [], []
            for n in walk(sec):
                style = n.attrs.get('style', '')
                t = own_text(n)
                if t and keep_label(t, style):
                    labels.append(t)
                if ACTIVE_TAB_RE.search(style) and n.parent:
                    sib = [own_text(s) or full_text(s) for s in n.parent.children]
                    sib = [x for x in sib if x and len(x) <= 30 and not DIGIT_RE.search(x)]
                    if 2 <= len(sib) <= 12:
                        tabs.extend(x for x in sib if x not in tabs)
                if n.tag == 'a':
                    href = n.attrs.get('href', '')
                    m = re.match(r'([^#]+\.dc\.html)(?:#([\w-]+))?$', href)
                    if m:
                        tgt = route_by_file_frame.get((m.group(1), m.group(2))) \
                              or route_by_file_frame.get((m.group(1), None))
                        text = full_text(n)[:40]
                        if (tgt and text and not DIGIT_RE.search(text)
                                and text not in CHROME_LINKS
                                and (text, tgt) not in seen_links_global):
                            seen_links_global.add((text, tgt))
                            links.append({'text': text, 'target_route': tgt})
            # dedupe, keep order
            seen = set()
            labels = [x for x in labels if not (x in seen or seen.add(x))]
            seen = set()
            links = [l for l in links
                     if not ((l['text'], l['target_route']) in seen
                             or seen.add((l['text'], l['target_route'])))]
            frames_out.append({'file': f.name, 'frame': sec.attrs['id'],
                               'name': re.sub(r'\s*/\S*$', '', label).strip(' ·'),
                               'route': route, 'labels': labels,
                               'tabs': tabs, 'links': links})
    OUT.write_text(json.dumps({'generated_from': 'docs/specs/mockups',
                               'frames': frames_out}, indent=1))
    n_labels = sum(len(fr['labels']) for fr in frames_out)
    n_links = sum(len(fr['links']) for fr in frames_out)
    print(f"{len(frames_out)} frames · {n_labels} labels · {n_links} links → {OUT}")

if __name__ == '__main__':
    sys.exit(main())
