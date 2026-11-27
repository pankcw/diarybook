const C = window.DIARY_CONFIG, sb = supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
const $ = s => document.querySelector(s), all = s => [...document.querySelectorAll(s)];
let user = null, pages = [], cur = 0, timer, dirty = false, diary = {};
const st = t => $('#status').textContent = t;
const show = id => ['auth', 'stage'].forEach(x => $('#' + x).classList.toggle('hidden', x !== id));
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Auth ---------- */
sb.auth.onAuthStateChange((_, s) => {
  if (s && s.user) { if (!user || user.id !== s.user.id) setTimeout(() => start(s.user), 0); }
  else { user = null; show('auth'); }
});
$('#auth').onsubmit = async e => {
  e.preventDefault();
  const { error } = await sb.auth.signInWithPassword({ email: $('#em').value, password: $('#pw').value });
  $('#msg').textContent = error ? error.message : '';
};
$('#up').onclick = async () => {
  const { data, error } = await sb.auth.signUp({ email: $('#em').value, password: $('#pw').value });
  $('#msg').textContent = error ? error.message : (data.session ? '' : 'Cek email untuk konfirmasi akun, lalu masuk.');
};
$('#lo').onclick = async () => { await save(); sb.auth.signOut(); };

/* ---------- Load ---------- */
async function start(u) {
  user = u; show('stage');
  let { data: d } = await sb.from('diaries').select().eq('user_id', u.id).maybeSingle();
  if (!d) ({ data: d } = await sb.from('diaries').insert({ user_id: u.id }).select().single());
  diary = d || { title: 'My Little Diary', created_at: new Date() };
  $('#ctitle').textContent = diary.title;
  $('#cdate').textContent = 'Dimulai ' + new Date(diary.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' });
  const { data } = await sb.from('pages').select().order('page_no');
  pages = data && data.length ? data : [{ page_no: 1, title: '', content: '' }];
  cur = 0; render();
  $('#cover').classList.remove('open'); $('#book').classList.remove('on');
}

/* ---------- Page + save ---------- */
function render() {
  const p = pages[cur];
  $('#t').value = p.title || ''; $('#c').innerHTML = p.content || '';
  $('#ind').textContent = `${cur + 1} / ${pages.length}`; st('');
}
function edit() { dirty = true; st('Menyimpan…'); clearTimeout(timer); timer = setTimeout(save, 900); }
async function save() {
  clearTimeout(timer); if (!dirty) return;
  const p = pages[cur], n = cur + 1;
  p.title = $('#t').value; p.content = $('#c').innerHTML; dirty = false; st('Menyimpan…');
  const { error } = await sb.from('pages').upsert(
    { user_id: user.id, page_no: n, title: p.title, content: p.content, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,page_no' });
  if (error) { dirty = true; st('Gagal menyimpan ✗'); } else st('Tersimpan ✓');
}
$('#t').oninput = $('#c').oninput = edit;
$('#sv').onclick = () => { dirty = true; save(); };
addEventListener('visibilitychange', () => document.hidden && save());

/* ---------- Page flip ---------- */
async function go(n) {
  if (n < 0 || n >= pages.length || n === cur) return;
  await save();
  const pg = $('#page'); pg.dataset.d = n > cur ? 'f' : 'b'; pg.classList.add('out');
  await wait(290); cur = n; render(); pg.classList.remove('out');
}
$('#b1').onclick = () => go(0); $('#b2').onclick = () => go(cur - 1);
$('#b3').onclick = () => go(cur + 1); $('#b4').onclick = () => go(pages.length - 1);
$('#b5').onclick = async () => {
  await save(); pages.push({ page_no: pages.length + 1, title: '', content: '' });
  await go(pages.length - 1); dirty = true; save();
};

/* ---------- Cover ---------- */
$('#cover').onclick = e => { if (e.target.id === 'ctitle') return; $('#cover').classList.add('open'); $('#book').classList.add('on'); };
$('#ctitle').onblur = async e => {
  diary.title = e.target.textContent.trim() || 'My Little Diary';
  await sb.from('diaries').update({ title: diary.title }).eq('user_id', user.id);
};
$('#cl').onclick = async () => { await save(); $('#book').classList.remove('on'); $('#cover').classList.remove('open'); };

/* ---------- Editor ---------- */
const cmd = (c, v) => { $('#c').focus(); document.execCommand(c, false, v); edit(); };
all('[data-c]').forEach(b => { b.onmousedown = e => e.preventDefault(); b.onclick = () => cmd(b.dataset.c); });
$('#fn').onchange = e => cmd('fontName', e.target.value);
$('#fs').onchange = e => cmd('fontSize', e.target.value);
$('#col').oninput = e => cmd('foreColor', e.target.value);
$('#emo').onchange = e => { if (e.target.value) cmd('insertText', e.target.value); e.target.value = ''; };
$('#dt').onclick = () => cmd('insertText', new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }) + ' ');
$('#stk').onclick = () => cmd('insertHTML', '<span class="sticky">catatan kecil…</span>&nbsp;');
$('#phb').onclick = () => $('#ph').click();
$('#ph').onchange = async e => {
  const f = e.target.files[0]; if (!f) return; st('Mengunggah foto…');
  const path = `${user.id}/${Date.now()}-${f.name.replace(/[^\w.]/g, '_')}`;
  const { error } = await sb.storage.from('diary-media').upload(path, f);
  e.target.value = ''; if (error) return st('Foto gagal diunggah ✗');
  const { data } = sb.storage.from('diary-media').getPublicUrl(path);
  cmd('insertHTML', `<img class="photo" src="${data.publicUrl}" alt="foto">`);
};
