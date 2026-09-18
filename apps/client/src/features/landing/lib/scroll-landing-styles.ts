/** Scoped to the public page; app routes keep their own scrolling and theme. */
export const SCROLL_LANDING_CSS = `
.lp { position:absolute; inset:0; color:#183b2c; background:#f5f4ee; --landing-nav-ink:#183b2c; --landing-nav-button:#214e3d; --landing-nav-button-ink:#fff; }
.lp *, .lp *::before, .lp *::after { box-sizing:border-box; }
.lp-scroll { position:absolute; inset:0; overflow-x:hidden; overscroll-behavior-y:contain; scrollbar-color:#9aaf91 #f5f4ee; }
.lp-scroll:focus-visible { outline:2px solid #789b7a; outline-offset:-3px; }
.lp-header { position:absolute; inset:0 0 auto; height:94px; z-index:50; background:var(--landing-nav-background, #f5f4ee); border-bottom:1px solid #183b2c12; }

.lp-container { width:84%; max-width:1440px; margin-inline:auto; }
.lp h1,.lp h2,.lp h3,.lp h4,.lp p { margin:0; }
.lp h1,.lp h2 { font-weight:450; letter-spacing:-.065em; line-height:1.04; white-space:pre-line; }
.lp h1 { font-size:clamp(48px,5.2vw,90px); }
.lp h1 span { color:#6b855d; }
.lp h2 { font-size:clamp(38px,4.3vw,70px); }
.lp h3 { font-weight:500; font-size:27px; letter-spacing:-.035em; line-height:1.2; }
.lp p { line-height:1.65; }
.lp .lp-kicker { font-size:11px; font-weight:600; letter-spacing:.14em; line-height:1.6; margin-bottom:24px; }
.lp .lp-body { font-size:clamp(16px,1.2vw,19px); color:#637263; max-width:620px; margin-top:28px; }
.lp .lp-note { font-size:12px; color:#637263; margin-top:16px; }
.lp a { color:inherit; text-underline-offset:5px; }
.lp button { font-family:inherit; }
.lp :is(a,button):focus-visible { outline:3px solid #789b7a; outline-offset:5px; }
.lp .lp-button { display:inline-flex; align-items:center; justify-content:space-between; gap:32px; border:0; border-radius:8px; padding:20px 26px; font-size:15px; font-weight:600; background:#214e3d; color:#fff; cursor:pointer; text-decoration:none; transition:background .2s; }
.lp .lp-button:hover { background:#345f46; }
.lp .lp-button span { font-size:22px; }
.lp-hero { display:grid; grid-template-columns:1.15fr 1fr; align-items:center; gap:7%; padding-block:180px 110px; min-height: min(920px,100svh); }
.lp-actions { display:flex; align-items:center; flex-wrap:wrap; gap:28px; margin-top:36px; }
.lp-actions a,.lp-text-link { font-size:14px; }
.lp-text-link { padding:0; background:transparent; border:0; text-decoration:underline; text-underline-offset:5px; color:inherit; cursor:pointer; }
.lp-preview-stage { background:#e7ebdf; border-radius:16px; padding:28px; position:relative; }
.lp-preview-top { display:flex; gap:9px; align-items:center; font-size:12px; margin-bottom:24px; }
.lp-status-dot { width:7px; height:7px; border-radius:50%; background:#6b855d; }
.lp-resume-preview { background:#fffef9; border:1px solid #d9dfd0; box-shadow:0 18px 35px #183b2c0b; padding:32px; }
.lp-document-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:25px; }
.lp-document-head .lp-kicker { margin:0; font-size:9px; }
.lp-monogram { display:grid; place-items:center; width:46px; height:46px; flex-shrink:0; border-radius:50%; background:#dfe8ce; color:#36583e; font-size:16px; }
.lp-resume-preview h2 { font-size:29px; letter-spacing:-.045em; }
.lp .lp-role { font-size:13px; color:#637263; margin-top:8px; }
.lp-resume-preview hr { border:0; border-top:1px solid #dce1d5; margin:24px 0; }
.lp .lp-document-label { font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; margin:22px 0 10px; color:#637263; }
.lp-resume-preview p:not([class]) { font-size:13px; }
.lp-skills { display:flex; flex-wrap:wrap; gap:7px; margin:22px 0; }
.lp-skills span { border:1px solid #ced9c3; background:#f0f4e9; border-radius:4px; padding:5px 8px; font-size:10px; line-height:1.5; }
.lp-preview-metrics { display:grid; grid-template-columns:repeat(3,1fr); padding-top:22px; border-top:1px solid #dce1d5; }
.lp-preview-metrics > div { display:flex; flex-direction:column; gap:5px; }
.lp-preview-metrics strong { font-size:27px; font-weight:450; }
.lp-preview-metrics small,.lp-version-score small { font-size:11px; color:#637263; margin-left:3px; }
.lp-preview-metrics span { font-size:10px; color:#637263; }
.lp-review { display:flex; align-items:center; gap:10px; font-size:12px; margin-top:20px; }
.lp-review > span { display:grid; place-items:center; width:20px; height:20px; border-radius:50%; background:#214e3d; color:#e3edac; }
.lp-evidence { background:#103629; color:#f3f5e9; padding-block:90px 48px; border-radius:32px 32px 0 0; }
.lp-evidence-intro { padding-bottom:64px; }
.lp-evidence-intro h2 { max-width:1000px; }
.lp-evidence .lp-body { color:#b7cbb9; }
.lp-stat { width:84%; max-width:1440px; margin:auto; border-top:1px solid #b7cbb930; }
.lp .lp-stat section { min-height:0 !important; padding:80px 0 !important; gap:8% !important; }
.lp-stat section > div:first-child { max-width:800px; }
.lp .lp-stat h2 { font-size:clamp(30px,3.1vw,52px) !important; }
.lp-stat section > div[aria-hidden] { max-width:380px !important; }
.lp-stat-dor svg { max-height:350px !important; }
.lp-stat-qualified section { grid-template-columns:1.15fr 1fr !important; }
.lp-stat-qualified section > div { display:contents; }
.lp-stat-qualified h2 { grid-column:1; grid-row:1 / 3; align-self:center; }
.lp-stat-qualified section > div > div { grid-column:2; grid-row:1; color:#e3edac; margin:0 !important; }
.lp-stat-qualified section p { grid-column:2; grid-row:2; }
.lp-stat-qualified section a { grid-column:1 / -1; margin-top:0 !important; }
.lp .lp-evidence-note { font-size:12px; color:#b7cbb9; padding-top:24px; border-top:1px solid #b7cbb930; }
.lp-product,.lp-workflow { padding-block:110px; }
.lp-section-heading { max-width:1050px; margin-bottom:56px; }
.lp-section-heading .lp-body { max-width:660px; }
.lp-profile-strip { display:flex; align-items:center; gap:22px; border-block:1px solid #cfd7c7; padding-block:28px; margin-bottom:72px; }
.lp-profile-strip .lp-kicker { margin:0 0 6px; font-size:9px; }
.lp-profile-strip p { max-width:420px; margin-left:auto; font-size:14px; color:#637263; }
.lp-versions > h3 { font-size:clamp(28px,3vw,46px); }
.lp-versions .lp-body { margin-top:18px; }
.lp-version-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:20px; margin-top:40px; }
.lp-version { background:#fffef9; border:1px solid #d8dfcf; border-radius:8px; padding:28px; }
.lp-version:first-child { border-color:#96ad7e; }
.lp-version-index { display:flex; justify-content:space-between; font-size:11px; color:#6b855d; margin-bottom:32px; }
.lp-version h4 { font-size:23px; font-weight:500; letter-spacing:-.035em; min-height:58px; }
.lp-version-score { display:flex; justify-content:space-between; align-items:center; gap:14px; margin-top:20px; padding-block:18px; border-block:1px solid #dce1d5; }
.lp-version-score span { font-size:11px; max-width:120px; }
.lp-version-score strong { font-size:32px; font-weight:450; }
.lp-version p { font-size:14px; }
.lp .lp-version-note { border-top:1px solid #dce1d5; padding-top:20px; color:#637263; font-size:12px; }
.lp-scores { background:#e8eddf; padding-block:100px; }
.lp-score-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:24px; margin-top:24px; align-items:start; }
.lp-score-card { padding:22px; background:#f9faf4; border-top:3px solid #6b855d; }
.lp-score-card-red { border-top-color:#e5484d; }.lp-score-card-orange { border-top-color:#f0743a; }.lp-score-card-yellow { border-top-color:#d9a400; }.lp-score-card-light-green { border-top-color:#8bbf77; }.lp-score-card-dark-green { border-top-color:#286044; }
.lp-score-card h3 { font-size:20px; min-height:44px; }
.lp-score-number { font-size:64px; line-height:1.1; letter-spacing:-.07em; margin:14px 0 13px; }
.lp-score-number-red { color:#e5484d; }.lp-score-number-orange { color:#f0743a; }.lp-score-number-yellow { color:#b38400; }.lp-score-number-light-green { color:#5f984f; }.lp-score-number-dark-green { color:#286044; }
.lp-score-number small { font-size:19px; color:#637263; letter-spacing:-.02em; margin-left:6px; }
.lp-meter { height:5px; background:#d6dfcb; margin-bottom:16px; }
.lp-meter span { display:block; height:100%; background:linear-gradient(to right,#e5484d 0 20%,#f0743a 20% 40%,#d9a400 40% 60%,#8bbf77 60% 80%,#286044 80% 100%); }
.lp-score-card p { font-size:13px; color:#637263; }
.lp-score-explanation { margin-top:16px; padding-top:16px; border-top:1px solid #d6dfcb; }
.lp-score-explanation > strong { display:block; font-size:11px; margin:16px 0 5px; }
.lp-score-explanation > strong:first-child { margin-top:0; }
.lp-sub-scores { margin-top:18px; }
.lp-sub-scores .lp-kicker { font-size:9px; margin-bottom:12px; }
.lp-sub-scores > div { border-top:1px solid #d6dfcb; padding:9px 0; }
.lp-sub-scores > div > div { display:flex; justify-content:space-between; gap:12px; font-size:13px; }
.lp-sub-scores p { font-size:11px; margin-top:5px; }
.lp-steps { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:40px; list-style:none; padding:0; margin:0; }
.lp-steps li { padding-top:24px; border-top:1px solid #9eb08e; }
.lp-step-number { display:block; font-size:54px; font-weight:450; letter-spacing:-.06em; color:#789b7a; margin-bottom:36px; }
.lp-steps h3 { font-size:24px; margin-bottom:15px; }
.lp-steps p { color:#637263; font-size:15px; }
.lp-closing { background:#dfe8c8; padding-block:100px; }
.lp-closing h2 { font-size:clamp(48px,6.2vw,104px); max-width:1050px; }
.lp-closing-bottom { display:flex; align-items:center; justify-content:space-between; gap:48px; margin-top:40px; }
.lp-closing-bottom .lp-body { margin:0; max-width:560px; }
.lp-footer { display:flex; justify-content:space-between; flex-wrap:wrap; gap:24px; padding-block:32px; font-size:12px; color:#637263; }
.lp-footer > div { display:flex; gap:24px; }
.lp-scene { display:flex; flex-direction:column; justify-content:center; }
.lp-scene > .lp-container { padding-block:120px 90px; }
.lp-scene .lp-hero { padding-block:135px 80px; }
.lp-scene .lp-scores,.lp-scene .lp-workflow,.lp-scene .lp-closing { padding-block:120px 90px; }
.lp-scene .lp-scores { background:transparent; }
.lp-scene .lp-closing { flex:1; background:transparent; }
.lp-scene-cta .lp-footer { padding-block:24px 72px; }
.lp-scene-vivo .lp-profile-strip { margin-bottom:0; }
.lp-scene-versions > .lp-versions > .lp-body { margin-bottom:20px; }
.lp-scene-versions .lp-version-grid { margin-top:20px; }
.lp-scene-hero .lp-hero-copy { max-width:690px; }
.lp-header { border-bottom-color:color-mix(in srgb, var(--landing-nav-ink) 10%, transparent); }
@media(min-width:1024px) {
.lp-scene-notas .lp-scores { min-height:100svh; padding-block:104px 20px; display:flex; align-items:center; }
.lp-scene-notas .lp-scores > .lp-container { width:84%; }
.lp-scene-notas .lp-section-heading { margin-bottom:16px; max-width:900px; }
.lp-scene-notas .lp-section-heading .lp-kicker { margin-bottom:10px; }
.lp-scene-notas .lp-section-heading h2 { font-size:clamp(34px,3.2vw,52px); }
.lp-scene-notas .lp-section-heading .lp-body { font-size:14px; line-height:1.5; margin-top:12px; max-width:720px; }
.lp-scene-notas > .lp-scores > .lp-container > .lp-note { margin-top:8px; }
.lp-scene-notas .lp-score-grid { margin-top:10px; gap:14px; }
.lp-scene-notas .lp-score-card { padding:16px 18px; }
.lp-scene-notas .lp-score-card h3 { min-height:0; font-size:17px; }
.lp-scene-notas .lp-score-number { font-size:48px; margin:8px 0; }
.lp-scene-notas .lp-score-number small { font-size:15px; }
.lp-scene-notas .lp-meter { margin-bottom:10px; }
.lp-scene-notas .lp-score-explanation { margin-top:10px; padding-top:10px; }
.lp-scene-notas .lp-score-explanation > strong { margin:9px 0 3px; }
.lp-scene-notas .lp-sub-scores { margin-top:10px; }
.lp-scene-notas .lp-sub-scores .lp-kicker { margin-bottom:6px; }
.lp-scene-notas .lp-sub-scores > div { padding:6px 0; }
.lp-scene-notas .lp-sub-scores p { margin-top:2px; }
}
@media(min-width:1024px) and (max-height:800px) {
.lp-scene-notas .lp-scores { padding-block:86px 12px; }
.lp-scene-notas .lp-section-heading { margin-bottom:8px; }
.lp-scene-notas .lp-section-heading .lp-kicker { display:none; }
.lp-scene-notas .lp-section-heading h2 { font-size:32px; }
.lp-scene-notas .lp-section-heading .lp-body { margin-top:7px; font-size:12px; }
.lp-scene-notas .lp-score-card { padding:11px 14px; }
.lp-scene-notas .lp-score-number { font-size:38px; margin:4px 0; }
.lp-scene-notas .lp-score-card p { font-size:11px; line-height:1.4; }
.lp-scene-notas .lp-score-explanation { margin-top:6px; padding-top:6px; }
.lp-scene-notas .lp-score-explanation > strong { margin:5px 0 1px; font-size:9px; }
.lp-scene-notas .lp-sub-scores { margin-top:6px; }
.lp-scene-notas .lp-sub-scores > div { padding:3px 0; }
}
@media(min-width:1600px) { .lp-hero { gap:10%; } }
@media(max-width:1023px) {
.lp-container,.lp-stat { width:calc(100% - 48px); }
.lp-hero { padding-block:135px 72px; gap:40px; min-height:0; }
.lp h1 { font-size:clamp(42px,6vw,64px); }
.lp-preview-stage { padding:18px; }.lp-resume-preview { padding:22px; }
.lp-actions { gap:18px; }
.lp .lp-stat section { gap:36px !important; padding:60px 0 !important; }
.lp-stat section > div[aria-hidden] { max-width:300px !important; }
.lp .lp-stat-qualified section { grid-template-columns:1fr !important; }
.lp-stat-qualified section > div { display:block; }.lp-stat-qualified h2 { margin-bottom:24px !important; }
.lp-version-grid { grid-template-columns:1fr; gap:20px; }
.lp-version { padding:28px; }.lp-version h4 { min-height:0; }.lp-version p { max-width:700px; }
.lp-score-grid { gap:14px; }.lp-score-card { padding:20px; }
.lp-score-card h3 { font-size:18px; }
.lp-steps { gap:24px; }
}
@media(max-width:639px) {
.lp-header { height:80px; }.lp-container,.lp-stat { width:calc(100% - 40px); }
.lp-hero { grid-template-columns:1fr; padding-top:124px; gap:40px; }
.lp-scene > .lp-container { padding-block:110px 80px; }
.lp-scene .lp-scores,.lp-scene .lp-workflow,.lp-scene .lp-closing { padding-block:110px 80px; }
.lp h1 { font-size:49px; }.lp h2 { font-size:39px; }
.lp .lp-kicker { font-size:9px; margin-bottom:20px; }
.lp .lp-body { font-size:16px; margin-top:22px; }
.lp-actions { align-items:flex-start; flex-direction:column; gap:22px; margin-top:28px; }
.lp .lp-button { padding:18px 22px; }
.lp-preview-stage { padding:18px; }.lp-preview-top { font-size:10px; }.lp-resume-preview { padding:22px; }
.lp-document-head .lp-kicker { font-size:8px; margin:0; }
.lp-evidence { border-radius:20px 20px 0 0; padding-top:64px; }
.lp-evidence-intro { padding-bottom:44px; }
.lp .lp-stat section { padding:48px 0 !important; gap:30px !important; }
.lp .lp-stat h2 { font-size:30px !important; }
.lp-stat-dor svg { max-height:260px !important; }
.lp-stat section > div[aria-hidden] { max-width:240px !important; }
.lp-product,.lp-workflow,.lp-scores,.lp-closing { padding-block:64px; }
.lp-section-heading { margin-bottom:36px; }
.lp-profile-strip { flex-wrap:wrap; gap:16px; margin-bottom:48px; }
.lp-profile-strip p { flex-basis:100%; margin-left:0; }
.lp-version-grid { margin-top:28px; }.lp-version { padding:24px; }
.lp-score-grid { grid-template-columns:1fr; gap:24px; }.lp-score-card { padding:26px; }
.lp-score-card h3 { min-height:0; font-size:23px; }
.lp-steps { grid-template-columns:1fr; gap:32px; }.lp-step-number { margin-bottom:18px; }
.lp-closing h2 { font-size:51px; }.lp-closing-bottom { flex-direction:column; align-items:flex-start; gap:28px; margin-top:28px; }
.lp-footer { padding-block:28px; }
}
.flow-stage { position:relative; perspective:1200px; padding:8px 0 36px; min-width:0; }
.flow-job { position:relative; z-index:3; width:90%; margin-left:auto; background:#214e3d; color:#f3f5e9; padding:24px; border-radius:12px; box-shadow:0 14px 45px #183b2c16; }
.flow-job strong { display:block; font-size:21px; font-weight:500; letter-spacing:-.03em; }
.flow-job .lp-kicker { margin-bottom:9px; color:#cedcae; font-size:9px; }
.flow-tags { display:flex; flex-wrap:wrap; gap:7px; margin-top:16px; }
.flow-tags span { padding:5px 9px; border:1px solid #b7cbb960; border-radius:4px; font-size:10px; }
.flow-document { position:relative; background:#fffef9; border:1px solid #d3ddc8; border-radius:12px; padding:28px; box-shadow:0 20px 50px #183b2c12; }
.flow-document .lp-kicker { font-size:9px; margin-bottom:16px; color:#657458; }
.flow-document p:not(.lp-kicker) { font-size:16px; line-height:1.7; }
.flow-original { width:90%; margin-top:26px; color:#637263; z-index:1; }
.flow-adapted { background:#edf3df; border-color:#b4c592; }
.flow-result { width:94%; margin:-26px 0 0 auto; z-index:4; }
.flow-document mark { background:#d3e69d; color:#183b2c; padding:1px 3px; box-decoration-break:clone; }
.flow-explanation { padding-top:15px; margin-top:18px; border-top:1px solid #b4c592; font-size:12px; line-height:1.6; color:#546846; }
.lp .flow-caption { font-size:9px; line-height:1.9; color:#657458; margin-top:20px; letter-spacing:.04em; }
.flow-connections { margin-top:38px; }
.flow-connection { display:grid; grid-template-columns:.8fr 90px 1.4fr; align-items:center; gap:22px; min-height:100px; border-top:1px solid #cbd5c2; }
.flow-requirement { font-size:20px; letter-spacing:-.035em; }
.flow-requirement small { display:inline-block; margin-right:18px; font-size:11px; color:#789b7a; }
.flow-line { height:2px; background:#d8dfcc; }
.flow-line span { display:block; height:2px; background:#6b855d; transform-origin:left; }
.flow-connection strong { display:block; padding:18px; background:#e7edda; border-radius:6px; font-size:17px; font-weight:500; }
.flow-versions { margin-top:46px; perspective:1200px; }
.flow-source { display:grid; grid-template-columns:minmax(150px,.28fr) 1fr; gap:32px; align-items:start; padding:22px 0 26px; border-block:1px solid #bfcbb7; transform-origin:center top; }
.flow-source .lp-kicker { font-size:10px; margin:3px 0 0; }
.flow-source p:not(.lp-kicker) { max-width:900px; font-size:17px; line-height:1.65; }
.flow-two { position:relative; display:grid; grid-template-columns:1fr 1fr; gap:0; padding-top:58px; }
.flow-two::before { content:""; position:absolute; top:25px; left:25%; right:25%; border-top:1px solid #9eaf91; }
.flow-two::after { content:""; position:absolute; top:0; left:50%; height:25px; border-left:1px solid #9eaf91; }
.flow-version { position:relative; min-width:0; padding:0 clamp(24px,3.5vw,58px) 10px; }
.flow-version + .flow-version { border-left:1px solid #cbd5c2; }
.flow-version::before { content:""; position:absolute; top:-37px; left:50%; width:7px; height:7px; border-radius:50%; background:#66825d; box-shadow:0 0 0 6px #f6f5ef; transform:translateX(-50%); }
.flow-version-meta { display:flex; align-items:center; gap:13px; margin-bottom:20px; }
.flow-version-meta > span { color:#78906f; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10px; letter-spacing:.08em; }
.flow-version .lp-kicker { margin:0; color:#657458; font-size:9px; }
.flow-two h3 { max-width:470px; font-size:clamp(27px,2.3vw,36px); line-height:1.08; margin-bottom:20px; }
.flow-version > p { max-width:560px; font-size:16px; line-height:1.72; }
.flow-versions > .lp-note { margin-top:34px; }
.flow-evidence-group { padding-bottom:85px; color:#f3f5e9; }
.flow-evidence-group > section { min-height:0 !important; padding:120px 8% 45px !important; }
.flow-evidence-aside { display:flex; gap:36px; align-items:center; border-top:1px solid #b7cbb940; padding-top:28px; }
.flow-evidence-number { font-size:clamp(42px,6vw,84px); letter-spacing:-.06em; white-space:nowrap; color:#e3edac; font-weight:450; }
.flow-evidence-aside p { font-size:14px; color:#b7cbb9; margin-top:8px; max-width:900px; }
.flow-evidence-aside h3 { font-size:23px; color:#f3f5e9; }
.flow-evidence-aside a { display:block; margin-top:14px; font-size:10px; }
@media(max-width:639px) {
.flow-stage { margin-top:15px; padding-inline:4px; }.flow-job { padding:18px; width:96%; }.flow-job strong { font-size:18px; }
.flow-document { padding:20px; }.flow-document p:not(.lp-kicker) { font-size:14px; }.flow-result { margin-top:5px; width:96%; }.flow-original { width:96%; }
.flow-connection { grid-template-columns:1fr; gap:10px; padding-block:24px; }.flow-line { width:50px; }.flow-requirement { font-size:19px; }.flow-connection strong { font-size:15px; }
.flow-source { grid-template-columns:1fr; gap:12px; padding-block:18px 22px; }.flow-source p:not(.lp-kicker) { font-size:15px; }.flow-two { grid-template-columns:1fr; gap:0; padding-top:34px; }.flow-two::before,.flow-two::after { display:none; }.flow-version { padding:26px 0 30px 28px; border-left:1px solid #cbd5c2; }.flow-version + .flow-version { border-top:1px solid #cbd5c2; }.flow-version::before { top:32px; left:-1px; width:7px; height:7px; box-shadow:0 0 0 5px #f6f5ef; }.flow-version-meta { margin-bottom:16px; }.flow-two h3 { font-size:27px; margin-bottom:14px; }.flow-version > p { font-size:15px; }.flow-evidence-aside { flex-direction:column; align-items:flex-start; gap:8px; }
.flow-evidence-group > section { padding:110px 20px 40px !important; }.flow-evidence-group { padding-bottom:80px; }
}

.lp-scene-hero .lp-hero { grid-template-columns:.88fr 1.22fr; gap:5%; }
.resume-comparison { min-width:0; perspective:1400px; padding:18px 4px 35px; }
.resume-comparison-sheets { display:grid; grid-template-columns:minmax(0,1fr) 72px minmax(0,1fr); align-items:stretch; }
.resume-paper-wrap { min-width:0; display:flex; flex-direction:column; }
.lp .resume-version-label { display:flex; align-items:center; min-height:0; padding:0 0 10px; margin:0 0 18px; font-size:clamp(18px,1.45vw,22px); line-height:1.2; font-weight:500; letter-spacing:-.025em; border:0; border-bottom:1px solid #dfe3dc; }
.resume-label-original { background:transparent; color:#26372d; border-bottom-color:#dfe3dc; }
.resume-label-adapted { background:transparent; color:#26372d; border-bottom-color:#dfe3dc; }
.resume-dot { display:inline-block; width:6px; height:6px; border-radius:50%; }.resume-dot-red { background:#b96159; }.resume-dot-green { background:#4d8758; }
.resume-paper { position:relative; flex:1; min-height:410px; aspect-ratio:210/297; padding:22px 19px 34px; background:#fff; color:#37443d; border:1px solid #dedfd8; box-shadow:0 20px 45px #182d2414,0 2px 5px #182d2405; font-family:Arial,sans-serif; }
.resume-paper-after { border-top:3px solid #426d4d; }
.resume-paper-file { display:flex; justify-content:space-between; gap:5px; margin-bottom:22px; color:#8b928b; font-size:7px; letter-spacing:.02em; }
.lp .resume-paper h3 { font-family:Arial,sans-serif; font-size:20px; font-weight:600; letter-spacing:-.04em; line-height:1.15; }
.lp .resume-paper header p { font-size:9px; margin-top:7px; }
.resume-paper small { display:block; font-size:7px; line-height:1.5; color:#7b847c; margin-top:4px; }
.resume-paper section { margin-top:17px; padding-top:10px; border-top:1px solid #e5e8e1; }
.lp .resume-paper h4 { font-size:8px; letter-spacing:.10em; text-transform:uppercase; margin-bottom:8px; font-weight:600; }
.lp .resume-paper p,.resume-paper li { font-size:9px; line-height:1.75; }
.resume-paper section > strong { font-size:9px; font-weight:600; }
.resume-paper ul { margin:9px 0 0; padding-left:12px; }.resume-paper li { margin-bottom:6px; }
.resume-paper footer { position:static; margin-top:18px; display:flex; justify-content:space-between; padding-top:8px; border-top:1px solid #eceee8; font-size:6px; color:#969c95; }
.resume-mark { padding:2px 1px; background-repeat:no-repeat; background-position:0 50%; box-decoration-break:clone; -webkit-box-decoration-break:clone; }
.resume-mark-red { background-image:linear-gradient(#f6d8d4,#f6d8d4); text-decoration:line-through; text-decoration-color:rgba(174,75,66,var(--mark-progress)); text-decoration-thickness:1px; }
.resume-mark-green { background-image:linear-gradient(#d9eccd,#d9eccd); }
.resume-arrow { align-self:center; justify-self:center; display:grid; place-items:center; width:62px; height:62px; border-radius:50%; color:#f5f4ee; background:#214e3d; box-shadow:0 12px 28px #183b2c24,0 0 0 7px #e7ebdf; }
.resume-arrow svg { display:block; width:42px; overflow:visible; }
.lp .resume-document-caption { margin-top:14px; font-size:9px; color:#637263; }
.lp .resume-comparison-caption { margin-top:45px; font-size:12px; line-height:1.8; color:#637263; }
@media(min-width:1600px) { .resume-paper { padding:28px 23px 38px; min-height:480px; }.lp .resume-paper p,.resume-paper li { font-size:11px; }.lp .resume-paper h3 { font-size:24px; }.resume-paper section > strong { font-size:10px; }.resume-paper small { font-size:8px; } }
@media(max-width:1023px) { .lp-scene-hero .lp-hero { grid-template-columns:1fr; }.resume-comparison { width:100%; max-width:700px; margin:auto; }.resume-paper { min-height:450px; }.lp .resume-paper p,.resume-paper li { font-size:11px; } }
@media(max-width:639px) { .resume-comparison { padding:0 6px 20px; }.resume-comparison-sheets { grid-template-columns:1fr; gap:22px; }.resume-paper-wrap { width:100%; max-width:340px; margin:auto; }.resume-arrow { width:54px; height:54px; justify-self:center; transform:rotate(90deg); margin:8px 0; box-shadow:0 10px 24px #183b2c20,0 0 0 6px #e7ebdf; }.resume-arrow svg { width:37px; }.resume-paper { min-height:455px; }.lp .resume-paper h3 { font-size:23px; }.resume-paper-file,.resume-paper small { font-size:8px; }.resume-paper section > strong { font-size:11px; }.resume-paper section { margin-top:20px; }.lp .resume-version-label { font-size:21px; padding-bottom:9px; min-height:0; }.lp .resume-document-caption { font-size:11px; }.lp .resume-comparison-caption { margin-top:35px; } }

@media(prefers-reduced-motion:reduce) { .lp *, .lp *::before, .lp *::after { scroll-behavior:auto !important; transition:none !important; animation:none !important; } }
`;
