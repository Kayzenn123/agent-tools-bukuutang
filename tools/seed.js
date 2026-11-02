// node tools/seed.js            -> seed dari tanggal hari ini
// node tools/seed.js 2026-10-11 -> seed tanggal tertentu
// node tools/seed.js --reroll body -> acak ulang font body
const args = process.argv.slice(2);
const reroll = args.includes('--reroll') ? args[args.indexOf('--reroll')+1] : null;
const date = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || new Date().toISOString().slice(0,10);
const seedStr = reroll ? date + '#' + reroll + Date.now() : date;

function xmur3(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^=h>>>16)>>>0}}
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rnd = mulberry32(xmur3(seedStr)());
const pick = a => a[Math.floor(rnd()*a.length)];

const BAN = new Set(['Inter','Roboto','Arial','Poppins','Montserrat','Space Grotesk','Open Sans','Lato','Nunito','Raleway','Roboto Flex','Plus Jakarta Sans','DM Sans','Manrope']);

async function loadFonts(){
  const r = await fetch('https://api.fontsource.org/v1/fonts');
  const all = await r.json();
  return all.filter(f => f.type==='google' && f.subsets?.includes('latin') && !BAN.has(f.family));
}

const POOLS = {
  domain: ['tukang parkir','warung tegal','jadwal KRL','ronda malam','arisan','resep nenek','pasang surut','kalender weton','struk belanja','tiket konser','jalur sepeda','katalog tanaman','kartu pos','papan skor kampung','antrean puskesmas','pasar loak','radio tua','kamus bahasa daerah','stopwatch lomba 17-an','daftar harga bengkel'],
  layout: ['koran multi-kolom','horizontal scroll penuh','poster tipografi raksasa','bento asimetris dipotong','terminal interaktif','kartu bertumpuk bisa diseret','canvas pan/zoom dengan titik konten','spreadsheet sebagai UI','timeline satu sumbu','split screen dua dunia','scene zoom-through berantai','papan pengumuman penuh stiker'],
  reference: ['Swiss/International Style','risograph 2-3 warna','struk thermal','zine fotokopi','brutalism beton','label kemasan jadul','manual teknis 80-an','tiket bus antarkota','papan pengumuman RT','buku telepon','kartu remi','blueprint arsitek','game 8-bit','sampul kaset','koran kuning','poster film lawas','peta transit'],
  cameraMotion: ['zoom in saat scroll lalu pan kanan','pan horizontal pinned + zoom per panel','zoom-through teks jadi pintu','canvas drag + zoom scroll','parallax 5 layer + zoom out di akhir','kamera "terbang" lewat scroll (scale+translate+rotate)'],
  marquee: ['2 band arah berlawanan + skew velocity','marquee ikon SVG + teks','marquee diagonal','marquee melingkar di path SVG','3 band beda kecepatan bertumpuk','marquee vertikal di sisi layar'],
  textMotion: ['split huruf flip 3D','scramble/decode','variable font axis animasi','teks di path melengkung','outline terisi saat scroll','kata-kata jatuh lalu menumpuk'],
  inputMotion: ['magnetic + cursor shape-shift','tilt 3D pointer/gyro','drag inertia flick','hover mengubah tema seluruh halaman','cursor senter/spotlight mask'],
  reveal: ['clip-path lingkaran','curtain wipe antar section','GSAP Flip layout','morph SVG blob mask','garis draw-on lalu isi'],
  iconStyle: ['outline tipis 1px','outline tebal 3px sudut tajam','solid blocky','duotone','hand-drawn goyang (feTurbulence)','pixel-art','garis putus-putus','geometris bulat','stiker outline putih','glyph di kotak bergeser','isometrik','monoline satu garis menyambung'],
  iconSource: ['Lucide','Phosphor','Tabler','Iconoir','Remix','Bootstrap Icons','Material Symbols','Streamline','custom hand-built SVG'],
  constraint: ['2 warna + hitam putih','tanpa gambar, murni tipografi dan bentuk','tanpa border-radius','hanya garis tanpa fill','semua teks huruf kecil','satu ukuran biasa + satu ukuran raksasa','tanpa shadow dan gradient','grain/noise wajib','layout miring 3-8 derajat','hanya 3 ukuran font'],
};

const o = (L,C,H) => `oklch(${L.toFixed(2)} ${C.toFixed(3)} ${Math.round(((H%360)+360)%360)})`;
function palette(){
  const mode = pick(['light','dark','mid']);
  const hue = Math.floor(rnd()*360);
  const harmony = pick(['analogous','complementary','split-complementary','triadic','tetradic','monochrome']);
  const off = {analogous:[30,-30],complementary:[180,180],'split-complementary':[150,210],triadic:[120,240],tetradic:[90,180],monochrome:[0,0]}[harmony];
  const bgs = {
    light:{bg:o(.95+rnd()*.03,.02+rnd()*.04,hue),surface:o(.90,.04,hue),text:o(.2,.04,hue),muted:o(.45,.03,hue)},
    dark:{bg:o(.14+rnd()*.05,.02+rnd()*.04,hue),surface:o(.21,.04,hue),text:o(.94,.02,hue),muted:o(.65,.03,hue)},
    mid:{bg:o(.68+rnd()*.08,.09+rnd()*.06,hue),surface:o(.60,.11,hue),text:o(.16,.03,hue),muted:o(.32,.04,hue)},
  }[mode];
  return { mode, harmony, baseHue:hue, ...bgs,
    accent:o(.6+rnd()*.15,.16+rnd()*.12,hue+off[0]),
    accent2:o(.55+rnd()*.2,.14+rnd()*.12,hue+off[1]),
    pop:o(.78+rnd()*.1,.2+rnd()*.08,hue+180+(rnd()*80-40)),
    note:'Draf. Wajib cek kontras AA dan rapikan lightness/chroma.' };
}

(async () => {
  const fonts = await loadFonts();
  const bodyOK = fonts.filter(f => ['sans-serif','serif','monospace'].includes(f.category) && f.weights?.includes(400) && f.weights?.includes(700));
  const displayAll = fonts;
  const accentOK = fonts.filter(f => ['monospace','handwriting','display'].includes(f.category));
  const out = {
    seed: seedStr, totalFontsInPool: fonts.length,
    domain: pick(POOLS.domain), layout: pick(POOLS.layout), reference: pick(POOLS.reference),
    constraint: pick(POOLS.constraint),
    motion: { camera: pick(POOLS.cameraMotion), marquee: pick(POOLS.marquee), text: pick(POOLS.textMotion), input: pick(POOLS.inputMotion), reveal: pick(POOLS.reveal) },
    icons: { style: pick(POOLS.iconStyle), source: pick(POOLS.iconSource) },
    fonts: { display: pick(displayAll).family, body: pick(bodyOK).family, accent: pick(accentOK).family },
    palette: palette(),
  };
  if (reroll === 'body') console.log(JSON.stringify({ fonts: { body: out.fonts.body } }, null, 2));
  else console.log(JSON.stringify(out, null, 2));
})();
