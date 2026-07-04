# 18 — Predictive Models & Model Ops (6 screens): ❌ ALL MISSING ENTIRELY

**Status: None of these screens exist in the current build (user-confirmed). Build from scratch.** The sidebar has a "Models" item but no designed surfaces behind it.
Mockup sources: `Models.dc.html` · `Models Ops.dc.html`
Reference screenshots (in `screenshots/`): `18-models-mockup-1.png` (Models Overview, Training Run Detail, Model Card), `18-models-mockup-2.png` (Leaderboard, Feature Manifest, Retrain Center).

---

## A. Models Overview (/app/models) — Models.dc.html

Header: breadcrumb + H1 "Predictive models"; right outlined **"Retrain center →"**.
KPI cards: PROMOTED 8 · TRAINING RUNS · 30D 31 · FAILED 2 · RETRAIN DUE 3 · CHAMP/CHALLENGER 2 · PREDICTION TABLES 11.

Models table (MODEL · PURPOSE · STATUS · LAST TRAINED · ACCURACY · ACTIONS):
- Model cell: mono blue name + mono caption (`rev_loc_v2` / `LightGBM · weekly grain`).
- STATUS pills: `CHAMPION` green · `DRIFT 0.31` amber · `RUN FAILED` red.
- ACCURACY: `MAPE 4.1%` / `AUC 0.89` mono; failed = "—".
- ACTIONS: outlined Retrain + Card; drifted row gets primary **"Retrain now"**; failed row gets **"View logs"**.
Rows: rev_loc_v2 (Revenue forecast, CHAMPION, today 09:41) · churn_risk_v3 (Churn scoring, CHAMPION) · inventory_demand_v1 (Demand forecast, DRIFT 0.31) · sla_breach_v2 (SLA prediction, RUN FAILED).

## B. Training Run Detail (/app/models/runs/:id) — Models.dc.html

Header: mono `run 8842 · rev_loc` + pills `COMPLETED` / `PROMOTED` + right mono `today 09:41 · 48s`.
Tabs: **Summary** (active) · Backtest windows · Candidates · Features · Leakage · Logs.
Summary tab: 3 stat cards — CHAMPION **LightGBM** ("beats prior by 0.8pt") · BACKTEST MAPE **4.1%** ("5 rolling windows") · LEAKAGE CHECKS **14/14 ✓** ("2 features dropped"). Then **"Backtest error by window"** bar chart (5 windows, later windows darker blue). Bottom: dark mono log block:
```
09:41:22 window 3/5 · lgbm mape=0.041 · xgb mape=0.046
09:41:38 dropped feature future_promo_flag · leakage risk HIGH
09:41:47 promotion gate passed · champion=lgbm_v2
09:41:48 model card generated · card_8842
```

## C. Model Card (/app/models/:id) — Models.dc.html

Header: icon tile + mono `rev_loc_v2` + pills `PROMOTED · CHAMPION` (green) + `NO OVERFIT`; mono caption `card_8842 · LightGBM · trained today 09:41`; right outlined **Retrain**.
Left column: PURPOSE ("Forecast weekly net revenue per location, 8-week horizon, to flag target misses early."), TARGET `net_revenue` / ALGORITHM `LightGBM`, TRAINING DATA (`3,486 rows · 104 wks`) / FEATURES (`12 used · 2 dropped`), metric tiles MAPE 4.1% · MAE $4.9K · RMSE $7.2K.
Right column: **FEATURE IMPORTANCE** horizontal purple bars (foot_traffic → weather_idx); **SHAP SUMMARY · TOP DRIVER DIRECTION** dot plot (blue/red dots per feature); **LINKED ARTIFACTS** "Q3 Target Risk · Exec Weekly · +2".

## D. Model Leaderboard (/app/models/runs/:id/leaderboard) — Models Ops.dc.html

Left: "Candidate leaderboard · run 8842" + caption "ranked by mean MAPE across 5 backtest windows" + `windows: mean ▾` control. Table RANK · CANDIDATE · MAPE (±band) · MAE · TRAIN TIME · SELECT (radio): #1 LightGBM `CHAMPION` pill, 4.1% ±0.4, $4.9K, 18s, selected · #2 XGBoost 4.6% ±0.5 · #3 Prophet 5.8% ±0.7 · #4 Ridge 7.2% ±0.9, 3s. Footer: primary **Promote champion** + outlined **Override champion…**.

Right: **"Trade-off · LightGBM vs XGBoost"** scatter (error vs cost/run, labeled points) + **WHY LIGHTGBM WON** explainer card ("Best error on 4 of 5 windows, stable across holiday weeks, and 25% cheaper per training run than XGBoost. Ridge is fast but underfits promo interactions.") + mono footnote:
```
promotion gate: champion must beat incumbent by ≥0.5pt MAPE on ≥3 windows ✓
```

## E. Feature Manifest Viewer (/app/models/features/:id) — Models Ops.dc.html

Header: "Feature manifest · rev_loc_v2" + right mono `12 used · 2 dropped`.
Table FEATURE · ENCODING · IMPUTATION · LEAKAGE RISK · IMPORTANCE · STATUS:
- `foot_traffic_7d` (mono blue) · rolling mean · ffill · `LOW` green · purple importance bar · `APPROVED` green pill.
- Dropped row tinted red: `~~future_promo_flag~~` (struck through) · boolean · — · `HIGH` red · — · `DROPPED` red pill.
- `weather_idx` · bucketed · median · `MEDIUM` amber · small bar · `REVIEW` amber pill.

## F. Retrain Center (/app/models/retrain) — Models Ops.dc.html

Filter pills with counts: `All · 5` (active dark) · Scheduled · 2 · Drift · 2 · Failed · 1.
Rows (status dot + mono model name + mono reason + right action):
- `inventory_demand_v1` — amber dot — `drift-triggered · PSI 0.31 > 0.25` — primary **Retrain now**
- `churn_risk_v3` — amber dot — `drift-triggered · label shift detected` — **Retrain now**
- `rev_loc_v2` — blue dot — `scheduled · weekly Sun 03:00` — right mono `next in 2d`
- `sla_breach_v2` — red dot — red text `failed · training data gate: label nulls 4%` — outlined **View logs**

---

## Build notes

- Model Card is linked from: workbench inspector Model tab (doc 12), artifact detail Model tab (doc 13), "What's driving the forecast" card (doc 11), and Product marketing page. It's the trust surface for predictions — prioritize it with Models Overview.
- Leaderboard promotion gate copy must match Product page stage 4 claims (doc 03).
- Retrain triggers (drift/PSI, label shift, schedule) surface in notifications (doc 10) and activity feed.
