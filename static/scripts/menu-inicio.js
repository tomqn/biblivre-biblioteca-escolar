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

  /* ------------------------------------------------------------------
     O domínio biblivre.org.br deixou de ser do projeto e hoje abre um
     site de apostas. O Biblivre (parte compilada, que não dá para editar)
     ainda aponta para ele no logo do topo, no rodapé, na ajuda e no aviso
     de "nova versão". Aqui:
       - o logo passa a levar à página inicial da biblioteca;
       - os demais links vão para o código-fonte oficial no GitHub;
       - o aviso de "nova versão disponível" é removido, porque o texto e
         o link dele vêm desse domínio.
     ------------------------------------------------------------------ */
  var REPO_OFICIAL = 'https://github.com/Biblivre/Biblivre-5';

  function ehDominioAntigo(href) {
    return /^(https?:)?\/\/([a-z0-9-]+\.)*biblivre\.org\.br/i.test(href || '');
  }

  function corrigirLinksAntigos() {
    var base = descubrirBase();
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (!ehDominioAntigo(a.getAttribute('href'))) continue;
      var dentroDoLogo = a.querySelector('img') || (a.closest && a.closest('#logo_biblivre, #logo_biblivre_small, .logo'));
      if (dentroDoLogo) {
        a.setAttribute('href', base);
        a.removeAttribute('target');
      } else {
        a.setAttribute('href', REPO_OFICIAL);
        a.setAttribute('rel', 'noopener noreferrer');
      }
    }
    var avisos = document.querySelectorAll('.system_warning_new_version');
    for (var j = 0; j < avisos.length; j++) {
      if (avisos[j].parentNode) avisos[j].parentNode.removeChild(avisos[j]);
    }
  }

  function iniciarTudo() {
    init();
    corrigirLinksAntigos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarTudo);
  } else {
    iniciarTudo();
  }
})();