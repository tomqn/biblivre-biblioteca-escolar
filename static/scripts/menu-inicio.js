(function() {
  function descubrirBase() {
    // 1) Pelo CSS do Biblivre já carregado
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      var m = href.match(/^(.*?)\/static\/styles\//);
      if (m) return m[1] + '/';
    }
    // 2) Pelo link da logo
    var a = document.querySelector('#logo_biblivre a, #title a, #menu a');
    if (a) {
      var h = a.getAttribute('href') || '';
      if (h.indexOf('action=') === -1 && h.indexOf('http') !== 0) {
        return h.replace(/[^\/]*$/, '') || '/';
      }
    }
    // 3) Pela própria URL
    var m3 = window.location.pathname.match(/^\/([^\/]+)\//);
    return m3 ? '/' + m3[1] + '/' : '/';
  }

  function init() {
    var menuUl = document.querySelector('#menu > ul');
    if (!menuUl || document.getElementById('menu-inicio')) return;

    var li = document.createElement('li');
    li.id = 'menu-inicio';
    var a = document.createElement('a');
    a.href = descubrirBase();
    a.textContent = 'Início';
    a.title = 'Ir para a página inicial';
    li.appendChild(a);
    menuUl.insertBefore(li, menuUl.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();