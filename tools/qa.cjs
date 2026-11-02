// node tools/qa.js <URL> [--out folder]
// BROWSER=webkit node tools/qa.js <URL>   -> cek di WebKit
const { chromium, webkit } = require('playwright-core');
const fs = require('fs');
const engine = process.env.BROWSER === 'webkit' ? webkit : chromium;
const isChromium = engine === chromium;
const url = process.argv[2];
const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'screenshots';
fs.mkdirSync(out, { recursive: true });
const VIEWS = [['mobile-360', 360, 780], ['mobile-390', 390, 844], ['tablet-768', 768, 1024], ['desktop-1280', 1280, 800]];

(async () => {
  const browser = await engine.launch();
  const report = { url, engine: isChromium ? 'chromium' : 'webkit', views: [], reducedMotion: {}, fps4x: null };

  for (const [name, w, h] of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1, hasTouch: w < 500, isMobile: w < 500 });
    const page = await ctx.newPage();
    const issues = [];
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) issues.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', e => issues.push('pageerror: ' + e.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const small = [...document.querySelectorAll('a,button,input,select,textarea,[role=button]')].filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
      }).length;
      const noAlt = document.querySelectorAll('img:not([alt])').length;
      const noLabel = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')]
        .filter(e => !(e.labels && e.labels.length) && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby')).length;
      return {
        overflowX: de.scrollWidth > de.clientWidth + 1,
        scrollWidth: de.scrollWidth, clientWidth: de.clientWidth,
        smallTapTargets: small, imgsWithoutAlt: noAlt, inputsWithoutLabel: noLabel,
        h1Count: document.querySelectorAll('h1').length,
        lang: document.documentElement.lang || null,
        title: document.title || null,
      };
    });
    await page.screenshot({ path: `${out}/${name}.png` });
    await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
    report.views.push({ name, ...m, consoleIssues: issues });
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${out}/reduced-motion-390.png` });
    report.reducedMotion = await page.evaluate(() => ({
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      runningAnimations: document.getAnimations().filter(a => a.playState === 'running').length,
    }));
    await ctx.close();
  }

  if (isChromium) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await page.goto(url, { waitUntil: 'networkidle' });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    report.fps4x = await page.evaluate(async () => {
      let frames = 0, raf;
      const t0 = performance.now();
      const loop = () => { frames++; raf = requestAnimationFrame(loop); };
      loop();
      const total = Math.max(document.documentElement.scrollHeight - innerHeight, 0);
      const dur = 4000;
      await new Promise(res => {
        const s = performance.now();
        const step = () => {
          const p = Math.min((performance.now() - s) / dur, 1);
          window.scrollTo(0, total * p);
          p < 1 ? requestAnimationFrame(step) : res();
        };
        step();
      });
      cancelAnimationFrame(raf);
      return +(frames / ((performance.now() - t0) / 1000)).toFixed(1);
    });
    await ctx.close();
  } else {
    report.fps4x = 'dilewati (throttle CPU hanya di chromium)';
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  const bad = report.views.some(v => v.overflowX || v.consoleIssues.length || v.imgsWithoutAlt || v.inputsWithoutLabel || v.h1Count !== 1)
    || (typeof report.fps4x === 'number' && report.fps4x < 45);
  process.exit(bad ? 1 : 0);
})();
