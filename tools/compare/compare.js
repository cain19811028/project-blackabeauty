/* Compare page (plan_20261113 §7): lays out A and B, keeps them on the same section, replays the opening together.
   Talks to bridge.js inside each version by postMessage. */
(function () {
  'use strict';

  const META = JSON.parse(document.getElementById('meta').textContent);
  // Logical viewports the site renders at; bezel is the room the phone frame's box-shadow needs.
  const SIZES = {
    phone: { w: 375, h: 812, bezel: 11 },
    side: { w: 1440, h: 900, bezel: 0 },
  };
  const MODES = ['phone', 'toggle', 'side'];
  // Headings that make poor button labels: the hero's headline and the schools' count-up "75所".
  const LABELS = { top: '開場', schools: '承製院校' };
  const NAMES = { a: 'A 現行版', b: 'B 改版' };

  const body = document.body;
  const stage = document.getElementById('stage');
  const chipsEl = document.getElementById('chips');
  const tag = document.getElementById('tag');

  const frames = {};
  document.querySelectorAll('.frame').forEach((fig) => {
    const iframe = fig.querySelector('iframe');
    frames[fig.dataset.v] = {
      v: fig.dataset.v,
      fig,
      iframe,
      note: fig.querySelector('.frame__note'),
      base: iframe.dataset.src,
      sections: null,
      at: null,
    };
  });
  const both = () => [frames.a, frames.b];
  const other = (f) => (f === frames.a ? frames.b : frames.a);

  let leader = null;
  let shown = 'a';
  let activeId = null;

  const send = (f, msg) => f.iframe.contentWindow && f.iframe.contentWindow.postMessage({ bab: 'compare', ...msg }, '*');
  const has = (f, id) => Boolean(f.sections && f.sections.some((s) => s.id === id));

  // B's order wins; a section only A has goes right after the one it followed in A.
  function merged() {
    const out = [...(frames.b.sections || [])];
    (frames.a.sections || []).forEach((s, i, list) => {
      if (out.some((o) => o.id === s.id)) return;
      const prev = i ? out.findIndex((o) => o.id === list[i - 1].id) : -1;
      out.splice(prev + 1, 0, s);
    });
    return out;
  }

  function labelOf(id) {
    const s = merged().find((x) => x.id === id);
    return LABELS[id] || (s ? s.label : id);
  }

  // Two fixed lines, so the sentence never breaks mid-phrase and leaves an orphan.
  function note(f, id) {
    f.note.replaceChildren();
    if (id) {
      const who = document.createElement('span');
      const what = document.createElement('span');
      who.textContent = NAMES[f.v];
      what.textContent = `沒有「${labelOf(id)}」這一段`;
      f.note.append(who, what);
    }
    f.note.classList.toggle('is-on', Boolean(id));
  }

  function markChip(id) {
    activeId = id;
    chipsEl.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c.dataset.id === id));
  }

  function renderChips() {
    const ready = frames.a.sections && frames.b.sections;
    chipsEl.replaceChildren(...merged().map((s) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.dataset.id = s.id;
      chip.textContent = LABELS[s.id] || s.label;
      const only = !ready ? '' : !has(frames.a, s.id) ? 'B 新增' : !has(frames.b, s.id) ? 'A 才有' : '';
      if (only) {
        const small = document.createElement('small');
        small.textContent = only;
        chip.append(small);
      }
      chip.addEventListener('click', () => goto(s.id));
      return chip;
    }));
    markChip(activeId);
  }

  function goto(id) {
    leader = null; // both scroll on their own; neither should drag the other mid-way
    both().forEach((f) => {
      if (has(f, id)) {
        note(f, null);
        send(f, { type: 'goto', id });
      } else {
        note(f, id);
      }
    });
    markChip(id);
  }

  function onScroll(f, pos) {
    f.at = pos.id;
    if (leader === f) {
      const o = other(f);
      if (pos.bottom || has(o, pos.id)) {
        note(o, null);
        send(o, { type: 'follow', id: pos.id, frac: pos.frac, bottom: pos.bottom });
      } else {
        note(o, pos.id);
      }
    }
    const primary = body.dataset.mode === 'toggle' ? frames[shown] : frames.b;
    if (leader === f || (!leader && f === primary)) markChip(pos.id);
  }

  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || d.bab !== 'compare') return;
    const f = both().find((x) => x.iframe.contentWindow === e.source);
    if (!f) return;
    if (d.type === 'ready') {
      f.sections = d.sections;
      renderChips();
    } else if (d.type === 'interact') {
      if (leader !== f) note(f, null);
      leader = f;
    } else if (d.type === 'scroll') {
      onScroll(f, d);
    } else if (d.type === 'key') {
      onKey(d.key);
    }
  });

  function show(v) {
    shown = v;
    both().forEach((f) => f.fig.classList.toggle('is-shown', f.v === v));
    document.querySelectorAll('.seg--ab button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    tag.classList.toggle('is-b', v === 'b');
    tag.querySelector('b').textContent = v.toUpperCase();
    tag.querySelector('span').textContent = NAMES[v].slice(2);
    leader = frames[v];
    // Focus left inside the now-hidden frame would make it the leader again on the next key press.
    if (document.activeElement && document.activeElement.tagName === 'IFRAME') document.activeElement.blur();
    markChip(frames[v].at);
  }

  function onKey(k) {
    if (body.dataset.mode === 'toggle' && (k === 'a' || k === 'b')) show(k);
  }

  function layout() {
    const size = SIZES[body.dataset.mode];
    if (!size) return; // toggle: CSS makes the frame fill the stage
    const cs = getComputedStyle(stage);
    const fig = getComputedStyle(frames.a.fig);
    const caption = frames.a.fig.querySelector('figcaption').offsetHeight + parseFloat(fig.rowGap);
    const W = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const H = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const s = Math.min(1, (W - parseFloat(cs.columnGap) - 4 * size.bezel) / 2 / size.w, (H - caption - 2 * size.bezel) / size.h);
    stage.style.setProperty('--w', size.w);
    stage.style.setProperty('--h', size.h);
    stage.style.setProperty('--s', Math.max(0.1, s).toFixed(4));
  }

  // Each version initialises at the size it is shown at (the opening's cap flight is measured on load),
  // so frames load only after layout, and reload whenever the size changes.
  function replay() {
    leader = null;
    const stamp = Date.now();
    both().forEach((f) => {
      f.sections = null;
      f.at = null;
      note(f, null);
      f.iframe.src = `${f.base}?replay=${stamp}`;
    });
  }

  function setMode(mode) {
    body.dataset.mode = mode;
    document.querySelectorAll('.seg:not(.seg--ab) button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    // location.replace changes only the fragment: no reload, no history entry, and unlike replaceState it works on file://.
    location.replace(`#${mode}`);
    layout();
    replay();
  }

  document.querySelectorAll('.seg:not(.seg--ab) button').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.mode !== body.dataset.mode) setMode(b.dataset.mode);
  }));
  document.querySelectorAll('.seg--ab button').forEach((b) => b.addEventListener('click', () => show(b.dataset.v)));
  document.getElementById('replay').addEventListener('click', replay);
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    onKey(e.key.toLowerCase());
  });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    layout();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(replay, 400);
  });

  if (!META.__meta__) {
    document.getElementById('built').textContent = `產生於 ${META.builtAt}`;
    frames.a.fig.querySelector('figcaption').title = `${META.a.ref} · ${META.a.commit}`;
    frames.b.fig.querySelector('figcaption').title =
      `${META.b.ref} · ${META.b.commit}${META.b.dirty ? ' ＋ 未提交的修改' : ''}`;
  }

  show('a');
  setMode(MODES.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'phone');
})();
