const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto('http://127.0.0.1:8931/agent-tools-bukuutang/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const els = await p.evaluate(() => {
    return [...document.querySelectorAll('a,button,input,select,textarea,[role=button]')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
    }).map(e => {
      const r = e.getBoundingClientRect();
      const cls = typeof e.className === 'string' ? e.className.split(' ').slice(0, 2).join('.') : '';
      return e.tagName + (e.id ? '#' + e.id : '') + (cls ? '.' + cls : '') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' "' + (e.textContent || '').trim().slice(0, 20) + '"';
    });
  });
  console.log(els.join('\n'));
  await b.close();
})();
