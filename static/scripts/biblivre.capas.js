/* ==========================================================================
   Capas por registro — Biblivre (biblioteca escolar)
   --------------------------------------------------------------------------
   - Painel "Capa do livro" na Catalogação: enviar, trocar e remover a capa
     de CADA registro (uma capa por registro, como nos outros sistemas).
   - Miniaturas nos resultados de busca (Catalogação e Pesquisa).
   A imagem é redimensionada no navegador (máx. 600×900, JPEG) antes do
   envio, então fotos grandes do celular funcionam sem pesar no banco.
   O servidor é o capa.jsp (rota ?controller=capa).
   ========================================================================== */
var Capas = (function($) {
	'use strict';

	var LARGURA_MAX = 600;
	var ALTURA_MAX = 900;
	var QUALIDADE = 0.86;
	var TAMANHO_ORIGINAL_MAX = 25 * 1024 * 1024; // 25 MB (foto de celular)

	var ICONE_LIVRO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>';
	var ICONE_ENVIO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';

	var estado = {
		id: null,
		info: null,
		anexos: [],
		ocupado: false
	};

	function urlCapa(id, versao) {
		return '?controller=capa&id=' + encodeURIComponent(id) + (versao ? '&v=' + versao : '');
	}

	function escapar(txt) {
		return String(txt == null ? '' : txt)
			.replace(/&/g, '&amp;').replace(/</g, '&lt;')
			.replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	/* ------------------------------------------------------------------
	   Miniaturas dos resultados de busca
	   ------------------------------------------------------------------ */
	function semCapa(img) {
		var box = img && img.parentNode;
		if (!box) return;
		box.className += ' result_cover--vazia';
		box.innerHTML = ICONE_LIVRO;
	}

	function atualizarMiniaturas(id, versao) {
		$('.result_cover[data-capa-id="' + id + '"]').each(function() {
			var box = $(this);
			if (versao) {
				box.removeClass('result_cover--vazia')
					.html('<img src="' + urlCapa(id, versao) + '" alt="" loading="lazy" decoding="async" onerror="Capas.semCapa(this)" />');
			} else {
				box.addClass('result_cover--vazia').html(ICONE_LIVRO);
			}
		});
	}

	/* ------------------------------------------------------------------
	   Painel da Catalogação
	   ------------------------------------------------------------------ */
	function painel() {
		return $('#capa_registro');
	}

	function status(msg, tipo) {
		painel().find('.capa-painel__status')
			.attr('data-tipo', tipo || 'info')
			.text(msg || '');
	}

	function render() {
		var el = painel();
		if (!el.length) return;

		if (!estado.id) {
			el.html(
				'<div class="capa-painel capa-painel--sem-registro">' +
				'  <div class="capa-painel__preview capa-painel__preview--vazia">' + ICONE_LIVRO + '</div>' +
				'  <div class="capa-painel__acoes"><p class="capa-painel__dica">Salve o registro para poder adicionar a capa.</p></div>' +
				'</div>');
			return;
		}

		var info = estado.info || {};
		var editavel = !!info.editable;
		var temCapa = !!info.exists;

		var preview = temCapa
			? '<img src="' + urlCapa(estado.id, info.v) + '" alt="Capa do registro ' + escapar(estado.id) + '" />'
			: ICONE_LIVRO + '<span class="capa-painel__vazio-txt">Sem capa</span>';

		var html =
			'<div class="capa-painel">' +
			'  <div class="capa-painel__preview' + (temCapa ? '' : ' capa-painel__preview--vazia') + (editavel ? ' capa-painel__preview--soltavel' : '') + '"' +
			(editavel ? ' tabindex="0" role="button" aria-label="Escolher imagem de capa (ou arraste um arquivo aqui)"' : '') + '>' +
			preview +
			(editavel ? '<span class="capa-painel__soltar">Solte a imagem aqui</span>' : '') +
			'  </div>' +
			'  <div class="capa-painel__acoes">';

		if (editavel) {
			html +=
				'<div class="capa-painel__botoes">' +
				'  <label class="button center capa-painel__enviar">' + ICONE_ENVIO +
				'    <span>' + (temCapa ? 'Trocar capa' : 'Enviar capa') + '</span>' +
				'    <input type="file" accept="image/jpeg,image/png,image/webp,image/*" class="capa-painel__arquivo" />' +
				'  </label>' +
				(temCapa ? '<a href="javascript:void(0);" class="danger_button center capa-painel__remover">Remover</a>' : '') +
				'</div>' +
				'<p class="capa-painel__dica">JPG, PNG ou WebP. Você também pode arrastar a imagem até a capa. ' +
				'Ela é ajustada automaticamente (até ' + LARGURA_MAX + '×' + ALTURA_MAX + ' px).</p>';

			var imagensAnexas = $.grep(estado.anexos || [], function(a) {
				return a && /\.(jpe?g|png|webp|gif)$/i.test(a.name || '');
			});
			if (imagensAnexas.length) {
				html += '<div class="capa-painel__anexos"><span>Usar imagem já anexada:</span>';
				$.each(imagensAnexas, function(i, a) {
					html += '<a href="javascript:void(0);" class="capa-painel__anexo" data-uri="' + escapar(a.uri) + '">' + escapar(a.name) + '</a>';
				});
				html += '</div>';
			}
		} else {
			html += '<p class="capa-painel__dica">' +
				(temCapa ? 'Capa cadastrada para este registro.' : 'Este registro ainda não tem capa.') +
				' Para alterar, entre com um usuário com permissão de catalogação.</p>';
		}

		html += '<div class="capa-painel__status" role="status" aria-live="polite"></div>' +
			'  </div>' +
			'</div>';

		el.html(html);
	}

	function carregar(id) {
		if (!painel().length) return;

		if (!id || $.trim(String(id)) === '') {
			estado.id = null;
			estado.info = null;
			render();
			return;
		}

		if (estado.id != id) {
			estado.anexos = [];
		}
		estado.id = id;
		estado.info = null;
		painel().html('<div class="capa-painel"><div class="capa-painel__preview capa-painel__preview--vazia capa-painel__preview--carregando">' + ICONE_LIVRO + '</div></div>');

		$.ajax({
			url: urlCapa(id) + '&action=info',
			dataType: 'json',
			cache: false
		}).done(function(resp) {
			if (estado.id != id) return;
			estado.info = resp || {};
			render();
		}).fail(function() {
			if (estado.id != id) return;
			estado.info = { exists: false, editable: false };
			render();
			status('Não foi possível consultar a capa deste registro.', 'erro');
		});
	}

	/* Lê o arquivo, redimensiona num canvas e devolve um dataURL JPEG */
	function prepararImagem(origem, callback) {
		var img = new Image();
		img.onload = function() {
			var w = img.naturalWidth || img.width;
			var h = img.naturalHeight || img.height;
			if (!w || !h) {
				callback(null, 'Não foi possível ler a imagem.');
				return;
			}
			var escala = Math.min(1, LARGURA_MAX / w, ALTURA_MAX / h);
			var cw = Math.max(1, Math.round(w * escala));
			var ch = Math.max(1, Math.round(h * escala));

			var canvas = document.createElement('canvas');
			canvas.width = cw;
			canvas.height = ch;
			var ctx = canvas.getContext('2d');
			ctx.fillStyle = '#ffffff'; // PNG transparente vira fundo branco
			ctx.fillRect(0, 0, cw, ch);
			ctx.imageSmoothingEnabled = true;
			if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(img, 0, 0, cw, ch);

			try {
				callback(canvas.toDataURL('image/jpeg', QUALIDADE));
			} catch (e) {
				callback(null, 'O navegador bloqueou a leitura desta imagem.');
			}
		};
		img.onerror = function() {
			callback(null, 'Arquivo de imagem inválido ou formato não suportado pelo navegador.');
		};
		img.src = origem;
	}

	function processarArquivo(arquivo) {
		if (!arquivo || estado.ocupado) return;
		if (arquivo.type && arquivo.type.indexOf('image/') !== 0) {
			status('Escolha um arquivo de imagem (JPG, PNG ou WebP).', 'erro');
			return;
		}
		if (arquivo.size > TAMANHO_ORIGINAL_MAX) {
			status('Imagem muito grande (máx. 25 MB).', 'erro');
			return;
		}

		status('Preparando imagem…', 'info');
		var leitor = new FileReader();
		leitor.onload = function(ev) {
			prepararImagem(ev.target.result, function(dataUrl, erro) {
				if (!dataUrl) {
					status(erro, 'erro');
					return;
				}
				enviar(dataUrl);
			});
		};
		leitor.onerror = function() {
			status('Não foi possível ler o arquivo.', 'erro');
		};
		leitor.readAsDataURL(arquivo);
	}

	function enviar(dataUrl) {
		var id = estado.id;
		if (!id) return;
		estado.ocupado = true;
		painel().find('.capa-painel').addClass('capa-painel--ocupado');
		status('Enviando capa…', 'info');

		$.ajax({
			url: '?controller=capa',
			type: 'POST',
			dataType: 'json',
			data: { action: 'save', id: id, data: dataUrl }
		}).done(function(resp) {
			if (resp && resp.success) {
				estado.info = $.extend({}, estado.info, { exists: true, v: resp.v });
				render();
				status('Capa salva!', 'ok');
				atualizarMiniaturas(id, resp.v);
			} else {
				status((resp && resp.message) || 'Não foi possível salvar a capa.', 'erro');
			}
		}).fail(function(xhr) {
			var msg = 'Não foi possível salvar a capa.';
			try { msg = JSON.parse(xhr.responseText).message || msg; } catch (e) {}
			status(msg, 'erro');
		}).always(function() {
			estado.ocupado = false;
			painel().find('.capa-painel').removeClass('capa-painel--ocupado');
		});
	}

	function remover() {
		var id = estado.id;
		if (!id || estado.ocupado) return;
		if (!window.confirm('Remover a capa deste registro?')) return;

		estado.ocupado = true;
		status('Removendo…', 'info');
		$.ajax({
			url: '?controller=capa',
			type: 'POST',
			dataType: 'json',
			data: { action: 'delete', id: id }
		}).done(function(resp) {
			if (resp && resp.success) {
				estado.info = $.extend({}, estado.info, { exists: false, v: null });
				render();
				status('Capa removida.', 'ok');
				atualizarMiniaturas(id, null);
			} else {
				status((resp && resp.message) || 'Não foi possível remover a capa.', 'erro');
			}
		}).fail(function(xhr) {
			var msg = 'Não foi possível remover a capa.';
			try { msg = JSON.parse(xhr.responseText).message || msg; } catch (e) {}
			status(msg, 'erro');
		}).always(function() {
			estado.ocupado = false;
		});
	}

	function usarAnexo(uri) {
		if (!uri || estado.ocupado) return;
		status('Copiando imagem anexada…', 'info');
		prepararImagem(uri, function(dataUrl, erro) {
			if (!dataUrl) {
				status(erro, 'erro');
				return;
			}
			enviar(dataUrl);
		});
	}

	function ligarEventos() {
		var el = painel();
		if (!el.length) return;

		el.on('change', '.capa-painel__arquivo', function() {
			var arquivo = this.files && this.files[0];
			processarArquivo(arquivo);
			this.value = '';
		});

		el.on('click', '.capa-painel__remover', function(e) {
			e.preventDefault();
			remover();
		});

		el.on('click', '.capa-painel__anexo', function(e) {
			e.preventDefault();
			usarAnexo($(this).attr('data-uri'));
		});

		// Clicar/Enter na prévia abre o seletor de arquivo
		el.on('click', '.capa-painel__preview--soltavel', function() {
			el.find('.capa-painel__arquivo').trigger('click');
		});
		el.on('keydown', '.capa-painel__preview--soltavel', function(e) {
			if (e.which === 13 || e.which === 32) {
				e.preventDefault();
				el.find('.capa-painel__arquivo').trigger('click');
			}
		});

		// Arrastar e soltar
		el.on('dragenter dragover', '.capa-painel__preview--soltavel', function(e) {
			e.preventDefault();
			e.stopPropagation();
			$(this).addClass('capa-painel__preview--arrastando');
		});
		el.on('dragleave dragend drop', '.capa-painel__preview--soltavel', function(e) {
			e.preventDefault();
			e.stopPropagation();
			$(this).removeClass('capa-painel__preview--arrastando');
		});
		el.on('drop', '.capa-painel__preview--soltavel', function(e) {
			var dt = e.originalEvent && e.originalEvent.dataTransfer;
			if (dt && dt.files && dt.files.length) {
				processarArquivo(dt.files[0]);
			}
		});
	}

	/* tipo = 'cataloging.bibliographic'. No Biblivre, a busca dispara eventos
	   com o prefixo "tipo." e o formulário (Input) com o prefixo "tipo". */
	function iniciarCatalogacao(tipo) {
		if (!painel().length || typeof Core === 'undefined') return;
		var busca = tipo + '.';
		var input = tipo;

		ligarEventos();
		render();

		Core.subscribe(busca + 'open-record', function(e, record) {
			carregar(record && record.id);
		});
		Core.subscribe(busca + 'after-load-record', function(e, record) {
			if (!record) return;
			estado.anexos = record.attachments || [];
			if (estado.id == record.id && estado.info) {
				render();
			} else {
				carregar(record.id);
			}
		});
		Core.subscribe(busca + 'record-changed', function(e, record) {
			if (record && record.id) {
				estado.anexos = record.attachments || estado.anexos;
				carregar(record.id);
			}
		});
		Core.subscribe(input + 'record-created', function(e, record) {
			if (record && record.id) carregar(record.id);
		});
		Core.subscribe(input + 'edit-record-start', function(e, id) {
			if (!id || $.trim(String(id)) === '') carregar(null);
		});
		Core.subscribe(input + 'edit-record-end', function() {
			if (!estado.id && CatalogingSearchAtual(tipo)) carregar(CatalogingSearchAtual(tipo));
		});
	}

	function CatalogingSearchAtual(tipo) {
		var s = window.CatalogingSearch;
		return (s && s.type === tipo && s.selectedRecord && s.selectedRecord.id) || null;
	}

	return {
		url: urlCapa,
		semCapa: semCapa,
		atualizarMiniaturas: atualizarMiniaturas,
		iniciarCatalogacao: iniciarCatalogacao,
		carregar: carregar
	};
})(jQuery);
