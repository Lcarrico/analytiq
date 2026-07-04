# 08 — Auth Flow: Mockup vs Current UI

Mockup source: `Auth.dc.html` (line numbers reference that file) — **8 screens**
Reference screenshots (in `screenshots/`): `08-auth-mockup-1.png` (Login, Register 1/3/4, Forgot password, Verify email), `08-auth-mockup-2.png` (SSO callback ×2), `08-auth-current-signin.png`, `08-auth-current-register.png`
Status: **6 of 8 mockup screens missing entirely.** The 2 that exist (Sign in, Create account) are architecturally wrong — rendered inside the app shell instead of as standalone pages — and leak internal implementation details into user-facing copy.

---

## ⚠️ Critical architectural problems in the current build

1. **Auth renders INSIDE the logged-in app shell.** Current Sign in / Create account pages show the full sidebar (Home, Create, Artifacts, Data…), the workspace switcher ("Acme Retail"), search bar, notifications, and a logged-in avatar ("DK") — all while the user is *not authenticated*. Breadcrumb even reads `acme-retail / settings / profile`. Mockup: every auth screen is a standalone centered card on `#f2f4f8` with a blue radial glow and the logo centered at top. Nothing else.
2. **Internal implementation copy is user-visible:** "Local fallback auth — PBKDF2 passwords, 24h bearer tokens." Never show this. Mockup subcopy: "Welcome back to your workspace."
3. **Debug panel exposed:** an "Agent memory" card ("Nothing remembered yet", "§17.3.1") sits under both auth forms. Not in any mockup auth screen — remove.
4. **Role is a raw dropdown ("analyst")** on register. Mockup collects role in step 3 via 4 selectable cards — and it's a separate wizard step, not a form field.

## Mockup screen inventory vs current

| # | Mockup screen | Route | Current status |
|---|---|---|---|
| 1 | Login | /login | ⚠️ Exists but wrong (in-app shell, no SSO/magic link/forgot) |
| 2 | Register step 1 (account) | /register | ⚠️ Exists but wrong (single flat form, no wizard) |
| 3 | Register step 3 (role cards) | /register | ❌ MISSING (dropdown instead) |
| 4 | Register step 4 (invite + first path) | /register | ❌ MISSING |
| 5 | Forgot password (form + sent) | /forgot-password | ❌ MISSING |
| 6 | Email verification | /verify-email | ❌ MISSING |
| 7 | SSO callback — signing in | /sso/callback | ❌ MISSING |
| 8 | SSO callback — no workspace access | /sso/callback | ❌ MISSING |

## 0. Shared standalone auth shell (all screens)

```html
<div style="background:#f2f4f8;position:relative;display:flex;align-items:center;justify-content:center">
  <div style="position:absolute;inset:0;background:radial-gradient(420px 260px at 50% 0%, rgba(37,99,235,.08), transparent 70%)"></div>
  <!-- logo centered, top:26px: 22px mark svg + Analyt<span style="color:#2563eb">IQ</span> -->
  <div style="position:relative;width:420px;background:#fff;border:1px solid #e4e8ef;border-radius:14px;box-shadow:0 12px 40px rgba(15,23,42,.08);padding:32px;display:flex;flex-direction:column;gap:18px">
```
Input pattern (all forms — current UI uses mono placeholder-only fields; mockup uses labeled fields):
```html
<label style="font-size:12px;font-weight:600;color:#334155">Email</label>
<input style="height:38px;border:1px solid #d4d9e1;border-radius:8px;padding:0 12px;font-family:'IBM Plex Sans',sans-serif;font-size:13.5px;color:#0f172a;outline:none" style-focus="border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)">
```

## 1. Login /login (lines 27–64)

Card contents in order: H1 "Log in" 20px/600 + "Welcome back to your workspace."; Email field; Password field with right-aligned "Forgot password?" link; primary button "Log in" (40px `#2563eb` radius 9); **OR divider** (mono 10px); **three SSO buttons** (38px outlined, brand SVGs): Continue with Google · Continue with Microsoft · Enterprise SSO; **magic-link box**:
```html
<div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border:1px dashed #d4d9e1;border-radius:9px;background:#fafbfc">
  <span style="font-size:12.5px;color:#64748b">Prefer a magic link?</span><span style="font-size:12.5px;font-weight:600;color:#2563eb;cursor:pointer">Email me a link</span>
</div>
```
Bottom of page (outside card): "Create account · Privacy & security" links.
Current UI missing: SSO buttons, magic link, forgot-password link, field labels, subcopy, standalone layout. Button says "Sign in" — mockup says "Log in".

## 2. Register wizard — 4 steps with stepper (lines 66–213)

Stepper (top of card): 24px circles joined by 2px lines. Active = blue fill + label; done = green check on `#e8f5ec`; upcoming = outlined `#d4d9e1`:
```html
<span style="width:24px;height:24px;border-radius:50%;background:#2563eb;color:#fff;...">1</span><span style="font-size:12px;font-weight:600;color:#0f172a">Account</span>
<span style="flex:1;height:2px;background:#eef1f5"></span>
<!-- done: background:#e8f5ec;color:#15803d; content ✓; connector background:#15803d;opacity:.25 -->
```

**Step 1 — Account:** H1 "Create your account" + "Free 14-day trial. No credit card required." Fields: Full name / Work email / Password (12+ characters) with **4-segment strength meter** (`height:3px`, filled `#15803d`, empty `#e4e8ef`). Footer: "Back to log in" + "Continue →" button.

**Step 3 — Role (labeled "Role"):** H1 "What best describes you?" + "We'll tune defaults and permissions to fit." 2×2 grid of cards; selected = `border:2px solid #2563eb;background:#f8faff` + blue check badge top-right:
```html
<div style="border:2px solid #2563eb;border-radius:11px;padding:16px;background:#f8faff;position:relative">
  <span style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-radius:50%;background:#2563eb;color:#fff;...">✓</span>
  <!-- icon svg 18px --><span style="font-size:13.5px;font-weight:600;color:#0f172a">Business User</span>
  <span style="font-size:11.5px;line-height:1.45;color:#64748b">I ask questions and consume dashboards</span>
</div>
```
Cards: Business User · Analyst ("I build and refine analyses for others") · Data Admin ("I manage sources, governance and access") · Executive ("I want answers and alerts, not tooling"). Footer: "← Back" + "Continue →".

**Step 4 — Kickoff:** "Invite teammates (optional)" — chip input with email pills (`background:#eff4ff;color:#1d4ed8;` mono 11px, ✕ to remove, "Add email…" ghost). "Choose your first path" — 3 selectable rows (34px icon chip + title + subtitle; selected = 2px blue border + check): **Start with sample data** ("Retail dataset preloaded — build in 60 seconds") · **Connect a warehouse** ("Snowflake, BigQuery, Databricks, Redshift…") · **Upload a file** ("CSV, XLSX or Parquet — profiled on upload"). Footer: "← Back" + "Create workspace →".

## 3. Forgot password /forgot-password (lines 215–239) — MISSING

Two states. Form card (300px): H2 "Reset password" + "We'll email you a reset link." + Email field + "Send reset link" button + "← Back to log in". Sent card: 46px green check circle (`#e8f5ec`/`#15803d`), H2 "Check your email", body "If `dana@acmeretail.com` has an account, a reset link is on its way. It expires in 30 minutes.", "Resend email" link.

## 4. Email verification /verify-email (lines 241–257) — MISSING

400px centered card: 64px blue envelope icon tile (`#eff4ff`, radius 18) with green check badge overlapping bottom-right; H1 "Verify your email"; "We sent a verification link to `dana@acmeretail.com`" (email in mono); "Didn't get it? Check spam, or" + "Resend email" link.

## 5. SSO callback /sso/callback (lines 259–287) — MISSING (2 states)

**Signing in:** 360px card, 44px SVG spinner (blue arc on `#eef1f5` track), H1 "Signing you in…" 17px, mono caption `okta · acme-retail.okta.com`.

**No workspace access (error):** page glow switches to red `rgba(220,38,38,.05)`. 56px red alert tile (`#fdeaea`, radius 16); H1 "No workspace access"; body "Your identity was verified, but `jon@acmeretail.com` hasn't been added to any AnalytIQ workspace yet."; "Contact your admin" button; mono footnote "Other states: organization not enabled · session expired".

---

## Priority order

1. Move auth OUT of the app shell → standalone centered-card pages (no sidebar/topbar/avatar pre-login).
2. Remove internal copy ("PBKDF2…", "Agent memory" panel) from auth screens.
3. Rebuild Login with labels, forgot-password link, SSO buttons, magic link.
4. Rebuild Register as the 4-step wizard (account → … → role cards → invite + first path).
5. Add forgot-password, verify-email, and both SSO callback screens.
