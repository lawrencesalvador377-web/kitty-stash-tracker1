const themeCss = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&display=swap');
.ks{--bg:#12151d;--surface:#1b2030;--raise:#252b3d;--line:rgba(255,255,255,.09);--text:#f1ede4;--muted:#98a1b5;--accent:#ff8a3d;
  background:var(--bg) !important;color:var(--text);font-family:'Bricolage Grotesque',system-ui,sans-serif;color-scheme:dark;padding:36px 20px 90px}
.wrap{max-width:620px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:18px;box-shadow:none;padding:22px;margin-bottom:16px}
.title{font-weight:800;letter-spacing:-.03em;font-size:30px}
.sub{color:var(--muted);font-weight:400}
.big{font-size:clamp(46px,11vw,68px);font-weight:800;letter-spacing:-.04em;font-variant-numeric:tabular-nums;line-height:1}
.input{background:#141826;color:var(--text);border:1px solid var(--line);border-radius:12px;font-weight:400}
.input::placeholder{color:#6b748a}
.input:focus{border-color:var(--accent);outline:none}
.btn{background:var(--accent);color:#1a1206;border:1px solid transparent;border-radius:12px;box-shadow:none;font-weight:600;transition:transform .12s,filter .12s}
.btn:hover{filter:brightness(1.08)}
.btn:active{transform:scale(.97);box-shadow:none}
.btn.alt{background:rgba(255,138,61,.14);color:var(--accent);border-color:rgba(255,138,61,.35)}
.btn.ghost{background:transparent;color:var(--text);border-color:rgba(255,255,255,.16)}
.ks :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.track{height:12px;border:0;background:var(--raise);margin:42px 4px 12px;
  background-image:repeating-linear-gradient(90deg,transparent 0 calc(25% - 1px),rgba(255,255,255,.2) calc(25% - 1px) 25%)}
.fill{background:var(--accent)}
.rider{color:var(--accent);top:-34px}
.item{border-top:1px solid var(--line)}
.thumb{border:0;border-radius:10px}
.noimg{border:1px dashed #3a4258;color:#4a536b}
.code{background:transparent;color:var(--accent);border:1px dashed var(--accent);border-radius:8px}
.err{color:#ff8f8f}
.modal{background:rgba(8,10,15,.85)}
.modal img{border:0;border-radius:16px}
.ks a{color:var(--accent)}
.ks div[style*="aspect-ratio"]{border-color:var(--line) !important;color:var(--muted)}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}
.stat{background:var(--raise);border-radius:12px;padding:12px}
.stat b{display:block;font-size:22px;letter-spacing:-.02em}
.stat span{font-size:12px;color:var(--muted)}
.bar{height:8px;background:var(--raise);border-radius:99px;margin:4px 0 12px}
.bar>div{height:100%;background:var(--accent);border-radius:99px}
.badge{display:inline-block;padding:4px 12px;border-radius:99px;border:1px solid var(--line);color:var(--muted);margin-right:6px;font-size:13px}

body{margin:0;background:#12151d}{background:var(--accent);color:#1a1206;border-color:var(--accent);font-weight:600}
`;
export default themeCss;
export const baseCss = `
body{margin:0}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}
.stat{background:#f3ecf7;border-radius:12px;padding:12px}
.stat b{display:block;font-size:22px}
.stat span{font-size:12px;color:#7a6a8a}
.bar{height:8px;background:#f3ecf7;border-radius:99px;margin:4px 0 12px}
.bar>div{height:100%;background:#ffb8c6;border-radius:99px}
.badge{display:inline-block;padding:4px 12px;border-radius:99px;border:2px solid #d8cbe3;color:#7a6a8a;margin-right:6px;font-size:13px}
.badge.on{background:#ffb8c6;color:#3b2f4a;border-color:#3b2f4a;font-weight:600}
`;
