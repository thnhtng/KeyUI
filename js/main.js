/* UI Control Baker — panel logic */
(function () {
  var cs = new CSInterface();
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage');

  var recording = false, playing = false;
  var frames = {}, order = [], imgMap = {};
  var recStart = 0, nextT = 0, timer = null;
  var els = [], stageEl = null, idoc = null, iwin = null;

  function log(msg) {
    var el = $('log');
    el.textContent += (el.textContent ? '\n' : '') + msg;
    el.scrollTop = el.scrollHeight;
  }

  // ---------- nạp HTML người dùng vào iframe ----------
  function loadHTML() {
    var code = $('code').value.trim();
    if (!code) { code = $('demo').textContent; $('code').value = code; }
    stage.onload = hookIframe;
    stage.srcdoc = code;
    log('Đã nạp HTML. Đợi sân khấu…');
  }

  function hookIframe() {
    try {
      idoc = stage.contentDocument;
      iwin = stage.contentWindow;
    } catch (e) { log('ERR truy cập iframe: ' + e); return; }
    stageEl = idoc.querySelector('[data-ae-stage]') || idoc.body;
    els = Array.prototype.slice.call(idoc.querySelectorAll('[data-ae]'));
    imgMap = {};
    for (var i = 0; i < els.length; i++) {
      var nm = els[i].getAttribute('data-ae');
      var im = els[i].getAttribute('data-ae-img');
      if (im) imgMap[nm] = im;
    }
    log('Tìm thấy ' + els.length + ' phần tử data-ae: ' +
        els.map(function (e) { return e.getAttribute('data-ae'); }).join(', '));
    fitStage();
  }

  // co iframe cho vừa khung xem (stage px có thể lớn hơn panel)
  function fitStage() {
    if (!stageEl) return;
    var compW = +$('cw').value || 1080, compH = +$('ch').value || 1920;
    var box = stage.parentElement.getBoundingClientRect();
    var sc = Math.min(box.width / compW, box.height / compH);
    stageEl.style.transform = 'scale(' + sc + ')';
    stageEl.style.transformOrigin = 'top left';
    stage._scale = sc; // (map toạ độ dùng getBoundingClientRect nên không cần, nhưng lưu lại)
  }

  // ---------- decompose ma trận CSS ----------
  function decompose(m) {
    if (!m || m === 'none') return { rot: 0, sx: 1, sy: 1 };
    var v = m.match(/matrix\(([^)]+)\)/);
    if (!v) return { rot: 0, sx: 1, sy: 1 };
    var p = v[1].split(',');
    var a = +p[0], b = +p[1], c = +p[2], d = +p[3];
    return {
      sx: Math.sqrt(a * a + b * b),
      sy: Math.sqrt(c * c + d * d),
      rot: Math.atan2(b, a) * 180 / Math.PI
    };
  }

  // ---------- lấy mẫu 1 frame ----------
  function grabFrame(tStamp) {
    var sr = stageEl.getBoundingClientRect();
    var compW = +$('cw').value || 1080, compH = +$('ch').value || 1920;
    var kx = compW / sr.width, ky = compH / sr.height;
    for (var i = 0; i < els.length; i++) {
      var el = els[i], name = el.getAttribute('data-ae');
      var r = el.getBoundingClientRect();
      var cx = (r.left + r.width / 2 - sr.left) * kx;
      var cy = (r.top + r.height / 2 - sr.top) * ky;
      var st = iwin.getComputedStyle(el);
      var dc = decompose(st.transform);
      var op = Math.round((parseFloat(st.opacity) || 1) * 100);
      if (!frames[name]) { frames[name] = []; order.push(name); }
      frames[name].push({
        t: +tStamp.toFixed(4),
        x: +cx.toFixed(2), y: +cy.toFixed(2),
        sx: +(dc.sx * 100).toFixed(2), sy: +(dc.sy * 100).toFixed(2),
        rot: +dc.rot.toFixed(2), op: op
      });
    }
  }

  function sampleTick() {
    if (!recording) return;
    var fps = Math.max(1, +$('fps').value || 30);
    var t = (performance.now() - recStart) / 1000;
    while (t >= nextT) { grabFrame(nextT); nextT += 1 / fps; }
  }

  // ---------- record / play ----------
  function startRec() {
    if (!els.length) { log('Chưa có phần tử data-ae. Bấm "Nạp HTML" trước.'); return; }
    frames = {}; order = []; recStart = performance.now(); nextT = 0; recording = true;
    var fps = Math.max(1, +$('fps').value || 30);
    if (timer) clearInterval(timer);
    timer = setInterval(sampleTick, 1000 / fps);
    $('recDot').classList.add('on'); $('recLabel').textContent = 'ĐANG GHI…';
    $('btnRec').textContent = '■ Dừng';
  }
  function stopRec() {
    recording = false; if (timer) { clearInterval(timer); timer = null; }
    $('recDot').classList.remove('on');
    var n = order.length ? frames[order[0]].length : 0;
    $('recLabel').textContent = 'Đã ghi ' + n + ' frame × ' + order.length + ' layer';
    $('btnRec').textContent = '● Ghi';
    var has = order.length > 0;
    $('btnPlay').disabled = !has; $('btnClear').disabled = !has; $('btnBake').disabled = !has;
  }
  function playback() {
    if (!order.length) return;
    playing = true; var fps = Math.max(1, +$('fps').value || 30);
    var t0 = performance.now();
    var iv = setInterval(function () {
      var i = Math.round((performance.now() - t0) / 1000 * fps);
      if (i >= frames[order[0]].length) { clearInterval(iv); playing = false; return; }
      for (var j = 0; j < order.length; j++) {
        var nm = order[j], f = frames[nm][i]; if (!f) continue;
        var el = els.filter(function (e) { return e.getAttribute('data-ae') === nm; })[0];
        if (!el) continue;
        var sr = stageEl.getBoundingClientRect();
        var compW = +$('cw').value, compH = +$('ch').value;
        // đặt lại theo tâm (chỉ để xem lại thô)
        el.style.left = (f.x / compW * sr.width - el.offsetWidth / 2) + 'px';
        el.style.top = (f.y / compH * sr.height - el.offsetHeight / 2) + 'px';
        el.style.opacity = f.op / 100;
      }
    }, 1000 / fps);
  }

  // ---------- bake sang AE ----------
  function bake() {
    var data = {
      fps: Math.max(1, +$('fps').value || 30),
      compW: +$('cw').value, compH: +$('ch').value,
      layers: order.map(function (nm) {
        return { name: nm, img: imgMap[nm] || '', frames: frames[nm] };
      })
    };
    var jsonStr = JSON.stringify(data);
    log('Đang bake ' + data.layers.length + ' layer…');
    cs.evalScript('uicbBake(' + JSON.stringify(jsonStr) + ')', function (res) {
      log('AE ▸ ' + res);
    });
  }

  // ---------- đọc comp đang mở ----------
  function refreshComp() {
    cs.evalScript('uicbGetComp()', function (res) {
      if (!res || res === 'NONE' || res.indexOf('ERR') === 0 ||
          res === 'EvalScript error.' || !/^\d/.test(res)) {
        $('compInfo').textContent = 'comp: (chưa chọn / chưa mở trong AE)';
        log('Chưa đọc được comp (mở & chọn 1 comp trong AE, rồi bấm "Đọc comp").');
        return;
      }
      var p = res.split(',');
      $('cw').value = p[0]; $('ch').value = p[1]; $('fps').value = Math.round(+p[2]);
      $('compInfo').textContent = 'comp: ' + p.slice(3).join(',') + ' ' + p[0] + '×' + p[1];
      fitStage();
      log('Đã đọc comp: ' + p[3] + ' ' + p[0] + '×' + p[1] + ' @' + Math.round(+p[2]) + 'fps');
    });
  }

  // ---------- wire ----------
  $('btnLoad').onclick = loadHTML;
  $('btnRec').onclick = function () { recording ? stopRec() : startRec(); };
  $('btnPlay').onclick = playback;
  $('btnClear').onclick = function () {
    frames = {}; order = []; $('recLabel').textContent = 'Chưa ghi';
    $('btnPlay').disabled = $('btnClear').disabled = $('btnBake').disabled = true;
  };
  $('btnBake').onclick = bake;
  $('btnRefresh').onclick = refreshComp;
  window.addEventListener('resize', fitStage);

  // khởi động: nạp demo + thử đọc comp
  $('code').value = $('demo').textContent.trim();
  loadHTML();
  setTimeout(refreshComp, 400);
})();
