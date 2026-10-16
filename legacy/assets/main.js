// Isi nomor WhatsApp CS format 62xxxxxxxxxx (tanpa + / spasi)
const CS_WA='6285711172317';
const waLink=t=>'https://wa.me/'+CS_WA+'?text='+encodeURIComponent(t);
const I={
pulsa:'<rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/>',
data:'<path d="M2 9a15 15 0 0 1 20 0"/><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>',
pln:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
pdam:'<path d="M12 2.5s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
bpjs:'<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/><path d="M12 8v6M9 11h6"/>',
inet:'<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
wallet:'<path d="M3 7a2 2 0 0 1 2-2h12v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="16" cy="13.5" r="1.2"/>',
fin:'<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
check:'<path d="M5 12.5 10 17l9-10"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',shield:'<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>',star:'<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6L12 16.8 6.6 19.6l1.1-6L3.2 9.4l6.1-.8z"/>'};
const SVC=[
{id:'pulsa',n:'Pulsa',t:'blue',f:'Nomor HP',ph:'08xx xxxx xxxx',items:[['Pulsa 10.000',11500],['Pulsa 25.000',26000],['Pulsa 50.000',50500],['Pulsa 100.000',99000]]},
{id:'data',n:'Paket Data',t:'purple',f:'Nomor HP',ph:'08xx xxxx xxxx',items:[['5 GB / 30 hari',35000],['12 GB / 30 hari',60000],['25 GB / 30 hari',95000],['Unlimited Harian',120000]]},
{id:'pln',n:'Token PLN',t:'green',f:'ID Pelanggan / No. Meter',ph:'11 digit nomor meter',items:[['Token 20.000',21500],['Token 50.000',51500],['Token 100.000',101500],['Token 200.000',201500]]},
{id:'pdam',n:'PDAM',t:'peach',f:'Nomor Pelanggan',ph:'Nomor pelanggan PDAM',bill:1},
{id:'bpjs',n:'BPJS',t:'blue',f:'Nomor VA Keluarga',ph:'8888 xxxx xxxx xxxx',bill:1},
{id:'inet',n:'Internet & TV',t:'purple',f:'ID Pelanggan',ph:'ID pelanggan provider',bill:1},
{id:'wallet',n:'E-Wallet',t:'green',f:'Nomor HP terdaftar',ph:'08xx xxxx xxxx',items:[['Top up 50.000',51000],['Top up 100.000',101000],['Top up 200.000',201000],['Top up 500.000',501000]]},
{id:'fin',n:'Multifinance',t:'peach',f:'Nomor Kontrak',ph:'Nomor kontrak cicilan',bill:1}];
const ROUTE={'pulsa': 'pulsa', 'data': 'data', 'pln': 'pln', 'pdam': 'pdam', 'bpjs': 'bpjs', 'inet': 'internet', 'wallet': 'ewallet', 'fin': 'multifinance'};const svcUrl=id=>'/'+(ROUTE[id]||'bayar');
const ic=(k,c='')=>`<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[k]}</svg>`;
const rp=n=>'Rp'+Number(n).toLocaleString('id-ID');
const TX={all(){try{return JSON.parse(localStorage.getItem('ldx_tx')||'[]')}catch(e){return[]}},save(t){const a=TX.all();a.unshift(t);try{localStorage.setItem('ldx_tx',JSON.stringify(a.slice(0,30)))}catch(e){}}};
const LOGO=(dark)=>`<span class="inline-flex items-center gap-2.5"><svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lg${dark?1:0}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b4fd8"/><stop offset="1" stop-color="#8a6cf7"/></linearGradient></defs><rect width="40" height="40" rx="12" fill="url(#lg${dark?1:0})"/><path d="M13 10v17h15" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="27.5" cy="13.5" r="3.6" fill="#7ff0c6"/></svg><span class="leading-none"><span class="block font-extrabold text-[19px] tracking-tight ${dark?'text-white':'text-[#16204a]'}">LUDOVEX</span><span class="block text-[9.5px] font-bold tracking-[.38em] mt-0.5 ${dark?'text-[#a9b3ff]':'text-[#3b4fd8]'}">DIGITAL</span></span></span>`;
const HEADER=`<header class="bg-white/85 backdrop-blur-md sticky top-0 z-30 border-b border-[#eceefa]"><nav class="max-w-6xl mx-auto px-5 h-[68px] flex items-center justify-between gap-4"><a href="/" aria-label="Ludovex Digital">${LOGO(0)}</a>
<div class="hidden md:flex gap-8 text-sm font-semibold text-[#6b7394]"><a href="/#layanan" class="hover:text-[#16204a]">Layanan</a><a href="/#alur" class="hover:text-[#16204a]">Cara Bayar</a><a href="/cek" class="hover:text-[#16204a]">Cek Transaksi</a><a href="/bantuan" class="hover:text-[#16204a]">Bantuan</a><a href="/tentang" class="hover:text-[#16204a]">Tentang</a></div>
<div class="flex items-center gap-2"><a href="/cek" class="md:hidden w-10 h-10 grid place-items-center rounded-full border border-[#e1e4f5] text-[#3b4fd8]" aria-label="Cek transaksi">${ic('search','w-5 h-5')}</a><a href="/bayar" class="btn !py-2.5 !px-5 text-sm whitespace-nowrap">Bayar<span class="hidden sm:inline">&nbsp;Sekarang</span></a></div></nav></header>`;
const FOOTER=`<footer class="bg-[#10173a] text-white/65 text-sm"><div class="max-w-6xl mx-auto px-5 pt-14 pb-8 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
<div>${LOGO(1)}<p class="mt-4 max-w-xs">Platform pembayaran digital untuk pulsa, data, token listrik, dan tagihan bulanan. Cepat, aman, harga bersahabat.</p></div>
<div><div class="text-white font-bold mb-3">Layanan</div><ul class="space-y-2"><li><a href="/pulsa">Pulsa & Data</a></li><li><a href="/pln">Token PLN</a></li><li><a href="/ewallet">E-Wallet</a></li><li><a href="/bpjs">Tagihan</a></li></ul></div>
<div><div class="text-white font-bold mb-3">Bantuan</div><ul class="space-y-2"><li><a href="/cek">Cek Transaksi</a></li><li><a href="/bantuan">Pusat Bantuan</a></li><li><a href="https://wa.me/${CS_WA}" target="_blank" rel="noopener">WhatsApp CS</a></li></ul><div class="text-white font-bold mb-3 mt-6">Perusahaan</div><ul class="space-y-2"><li><a href="/tentang">Tentang Kami</a></li><li><a href="/kebijakan-privasi">Kebijakan Privasi</a></li><li><a href="/syarat-ketentuan">Syarat & Ketentuan</a></li></ul></div>
<div><div class="text-white font-bold mb-3">Pembayaran</div><div class="flex flex-wrap gap-2">${['QRIS','DANA','OVO','GoPay','VA Bank'].map(x=>`<span class="px-2.5 py-1 rounded-md bg-white/10 text-white/85 text-xs font-semibold">${x}</span>`).join('')}</div></div></div>
<div class="max-w-6xl mx-auto px-5 py-6 border-t border-white/10 flex flex-col md:flex-row justify-between gap-2 text-xs"><span>© 2026 Ludovex Digital. All rights reserved.</span><span>Dibuat untuk transaksi yang lebih mudah.</span></div></footer>`;
document.querySelectorAll('[data-header]').forEach(e=>e.outerHTML=HEADER);
document.querySelectorAll('[data-footer]').forEach(e=>e.outerHTML=FOOTER);
document.querySelectorAll('[data-services]').forEach(el=>{el.innerHTML=SVC.map(s=>`<a href="${svcUrl(s.id)}" class="svc t-${s.t}">${ic(s.id)}<span class="text-sm md:text-base">${s.n}</span></a>`).join('')});
document.querySelectorAll('[data-ic]').forEach(e=>e.innerHTML=ic(e.dataset.ic,e.dataset.c||'w-full h-full'));

const setSvc=v=>{try{localStorage.setItem('ldx_svc',v||'');sessionStorage.setItem('ldx_svc',v||'')}catch(e){}};
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="/bayar"]');if(!a)return;const u=new URL(a.getAttribute('href'),location.origin);setSvc(u.searchParams.get('layanan'))},true);
document.addEventListener('submit',e=>{const f=e.target;if(f.getAttribute('action')==='/bayar'&&f.layanan){setSvc(f.layanan.value);try{localStorage.setItem('ldx_no',f.no?f.no.value:'')}catch(x){}}},true);
