/* 共用：自動產生右側 TOC（依 .doc section > h2）+ 行動版側欄開合 + 捲動高亮 */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    // 1. 行動版側欄開合
    var toggle = document.querySelector('.nav-toggle');
    var aside = document.querySelector('aside.nav');
    if (toggle && aside) {
      toggle.addEventListener('click', function () { aside.classList.toggle('open'); });
      aside.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') aside.classList.remove('open');
      });
    }

    // 2. TOC：抓 .doc section > h2，並把 section.id 覆寫為 section-N
    var toc = document.getElementById('toc-sidebar');
    var sections = document.querySelectorAll('.doc section');
    if (!toc || !sections.length) return;

    function esc(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    var html = '<div class="toc-title">本頁目錄</div>';
    var anchors = [];
    sections.forEach(function (sec, i) {
      var h2 = sec.querySelector(':scope > h2');
      if (!h2) return;
      var id = 'section-' + (i + 1);
      sec.id = id;

      // 標題文字（移除 .aud 徽章後）
      var clone = h2.cloneNode(true);
      var auds = clone.querySelectorAll('.aud');
      var badges = '';
      auds.forEach(function (a) {
        badges += '<span class="' + a.className + '">' + esc(a.textContent.trim()) + '</span>';
      });
      auds.forEach(function (a) { a.remove(); });
      var text = clone.textContent.replace(/\s+/g, ' ').trim();

      html += '<a href="#' + id + '" data-target="' + id + '">' + esc(text) +
        (badges ? '<span class="toc-aud">' + badges + '</span>' : '') + '</a>';
      anchors.push({ id: id, el: sec });
    });
    toc.innerHTML = html;

    // 3. 捲動高亮
    var links = toc.querySelectorAll('a');
    function onScroll() {
      var pos = window.scrollY + 120;
      var current = anchors[0] ? anchors[0].id : null;
      anchors.forEach(function (a) {
        if (a.el.offsetTop <= pos) current = a.id;
      });
      links.forEach(function (l) {
        l.classList.toggle('active', l.getAttribute('data-target') === current);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 4. Parameters / Responses 表格展開收合（預設收合，參考 delta/docs/care.html）
    document.querySelectorAll('.doc p > strong').forEach(function (s) {
      var t = s.textContent.trim();
      if (t.indexOf('Parameters') === -1 && t.indexOf('Responses') === -1) return;
      var p = s.parentNode;
      if (p.children.length !== 1) return; // 只處理「整段就是這個標籤」的 p
      var tbl = p.nextElementSibling;
      if (!tbl || tbl.tagName !== 'TABLE') return;

      p.classList.add('collapsible');
      tbl.style.display = 'none'; // 預設收合
      var arrow = document.createElement('span');
      arrow.className = 'collapse-arrow';
      arrow.textContent = '▸';
      s.appendChild(arrow);

      p.addEventListener('click', function () {
        var hidden = tbl.style.display === 'none';
        tbl.style.display = hidden ? '' : 'none';
        arrow.textContent = hidden ? '▾' : '▸';
      });
    });

    // 5. 側欄次選單展開收合（toggle 置最右）＋ 捲動定位到目前頁面
    var sidebar = document.querySelector('aside.nav');
    if (sidebar) {
      sidebar.querySelectorAll('nav').forEach(function (navEl) {
        var kids = Array.prototype.slice.call(navEl.children);
        var i = 0;
        while (i < kids.length) {
          var node = kids[i];
          var isHead = node.nodeType === 1 && node.classList.contains('nav-head');
          var isParentLink = node.tagName === 'A' && !node.classList.contains('nav-sub');
          if (isHead || isParentLink) {
            var subs = [];
            var j = i + 1;
            while (j < kids.length && kids[j].tagName === 'A' && kids[j].classList.contains('nav-sub')) {
              subs.push(kids[j]);
              j++;
            }
            if (subs.length) {
              var item = document.createElement('div');
              item.className = 'nav-item';
              navEl.insertBefore(item, node);
              item.appendChild(node);
              node.classList.add('nav-parent');
              var box = document.createElement('div');
              box.className = 'nav-children';
              subs.forEach(function (s) { box.appendChild(s); });
              var caret = document.createElement('button');
              caret.type = 'button';
              caret.className = 'nav-caret';
              caret.setAttribute('aria-label', '展開或收合次選單');
              caret.textContent = '▸';
              var toggle = function (e) {
                e.preventDefault();
                e.stopPropagation();
                var it = e.currentTarget.closest('.nav-item');
                if (it) it.classList.toggle('open');
              };
              caret.addEventListener('click', toggle);
              // 非連結標題（.nav-head）整列可點擊收合；連結父頁則只用右側箭頭
              if (isHead) node.addEventListener('click', toggle);
              item.appendChild(caret);
              item.appendChild(box);
              // 目前頁面所屬單元自動展開
              if (node.classList.contains('active') || box.querySelector('a.active')) {
                item.classList.add('open');
              }
            }
            i = j;
          } else {
            i++;
          }
        }
      });

      // 捲動側欄，使目前頁面項目定位到頂部附近
      var activeLink = sidebar.querySelector('a.active');
      if (activeLink) {
        var aRect = activeLink.getBoundingClientRect();
        var sRect = sidebar.getBoundingClientRect();
        sidebar.scrollTop += (aRect.top - sRect.top) - 80;
      }
    }
  });
})();
