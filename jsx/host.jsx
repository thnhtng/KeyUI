/*
 * UI Control Baker — host script (ExtendScript, chạy trong After Effects).
 * Nhận dữ liệu transform đã ghi từ panel -> tạo layer thật + keyframe
 * dưới layer đang chọn của comp hiện tại. Nền trong suốt.
 */

function _n(v, d) { return (typeof v === 'number' && !isNaN(v)) ? v : d; }

// Đọc thông tin comp hiện tại (panel gọi lúc mở để tự điền W/H/FPS)
function uicbGetComp() {
  var it = app.project ? app.project.activeItem : null;
  if (!(it && it instanceof CompItem)) return 'NONE';
  return it.width + ',' + it.height + ',' + it.frameRate + ',' + it.name;
}

// Bake: dataStr là chuỗi JSON đã stringify từ panel.
function uicbBake(dataStr) {
  var data;
  try { data = eval('(' + dataStr + ')'); }
  catch (e) { return 'ERR parse: ' + e.toString(); }

  var comp = app.project ? app.project.activeItem : null;
  if (!(comp && comp instanceof CompItem)) return 'ERR: hãy mở & chọn 1 comp trước.';
  if (!data.layers || !data.layers.length) return 'ERR: chưa có dữ liệu ghi (record trước).';

  app.beginUndoGroup('UI Control Baker');
  try {
    var fps = _n(data.fps, comp.frameRate);

    // chèn dưới layer đang chọn (nếu có), không thì lên trên cùng
    var sel = comp.selectedLayers;
    var insertIndex = (sel.length > 0) ? sel[0].index + 1 : 1;

    var made = 0;
    for (var li = 0; li < data.layers.length; li++) {
      var L = data.layers[li];
      var layer = null;

      // 1) có ảnh sprite -> import làm footage
      if (L.img && L.img.length) {
        var f = new File(L.img);
        if (f.exists) {
          try {
            var io = new ImportOptions(f);
            var foot = app.project.importFile(io);
            layer = comp.layers.add(foot);
          } catch (eImg) { layer = null; }
        }
      }
      // 2) không có ảnh -> solid placeholder (bạn thay ảnh sau)
      if (!layer) {
        layer = comp.layers.addSolid([1, 0.35, 0.35],
          (L.name || ('ctrl' + li)) + ' (thay ảnh)', 120, 120, comp.pixelAspect);
      }
      layer.name = L.name || layer.name;
      try { layer.moveTo(insertIndex); } catch (eMv) {}
      insertIndex = layer.index + 1; // layer kế tiếp nằm ngay dưới

      var tg  = layer.property('ADBE Transform Group');
      var pPos = tg.property('ADBE Position');
      var pScl = tg.property('ADBE Scale');
      var pRot = tg.property('ADBE Rotate Z');
      var pOpa = tg.property('ADBE Opacity');

      var fr = L.frames || [];
      for (var i = 0; i < fr.length; i++) {
        var k = fr[i];
        var t = _n(k.t, i / fps);
        if (k.x != null && k.y != null) pPos.setValueAtTime(t, [k.x, k.y]);
        if (k.sx != null)               pScl.setValueAtTime(t, [k.sx, _n(k.sy, k.sx)]);
        if (k.rot != null)              pRot.setValueAtTime(t, k.rot);
        if (k.op != null)               pOpa.setValueAtTime(t, k.op);
      }
      made++;
    }

    app.endUndoGroup();
    return 'OK: đã bake ' + made + ' layer + keyframe.';
  } catch (e) {
    app.endUndoGroup();
    return 'ERR: ' + e.toString();
  }
}
