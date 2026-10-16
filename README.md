# Bibliotecas escolares — Biblivre Personalizado

Reestruturação visual e funcional do **Biblivre 4** para bibliotecas
escolares. O projeto repagina **todo o `index.jsp`** e a camada de
**CSS** para transformar o OPAC padrão do Biblivre em uma interface
moderna, editorial e atrativa, inspirada em grandes livrarias e
catálogos internacionais.

> **Base:** Biblivre 4 (software livre do
> [IPISL](https://biblivre.org.br)) — licença AGPL v3.

---

## Índice

- [Sobre](#sobre)
- [O que mudou](#o-que-mudou)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Como aplicar](#como-aplicar)
- [Detalhes técnicos](#detalhes-técnicos)
- [Compatibilidade](#compatibilidade)
- [Créditos e licença](#créditos-e-licença)

---

<img width="1440" height="900" alt="image" src="https://github.com/user-attachments/assets/f623c812-b640-4568-92d9-6071a1b93455" />

<img width="1440" height="900" alt="image" src="https://github.com/user-attachments/assets/1e88f4dd-480f-4844-8c22-88f66dddd06e" />


## Sobre

Este repositório contém um **código JSP e CSS reestruturado para
bibliotecas escolares**, feito sobre uma instalação do Biblivre 4.
Não é uma cópia completa do Biblivre — apenas os arquivos modificados
e novos que dão forma a esta interface.

O ponto de partida foi o **`index.jsp`** original do Biblivre, que
trazia uma home simples, técnica e pouco convidativa. Ele foi
**completamente repaginado** para se tornar um **dashboard editorial
moderno**, inspirado na experiência de navegação de livrarias (vitrines
temáticas, capas em destaque, recomendações cruzadas, rankings de
leitura) e de catálogos de bibliotecas internacionais.

Junto com a home, **toda a camada de CSS foi reorganizada**: uma nova
folha (`biblivre.modern.css`) é carregada por último e sobrepõe o tema
visual do Biblivre original, modernizando cabeçalho, menus, resultados
de busca, formulários, tabelas e diálogos — sem alterar a estrutura
de classes nem o HTML do framework.

O objetivo foi transformar o Biblivre (originalmente com cara de
sistema administrativo dos anos 2000) em uma **vitrine editorial
escolar**, com:

- Hierarquia visual clara
- Linguagem acessível para crianças e adolescentes
- Descoberta de acervo por temas, não apenas por busca textual
- Gamificação leve (rankings) para incentivar a leitura
- Interface responsiva, funcional em celular e tablet

---

## O que mudou

### 🏠 Home editorial (repaginação completa do `index.jsp`)

O `index.jsp` original foi **reescrito do zero** para virar um dashboard
editorial. A estrutura atual inclui:

- **Hero** com saudação personalizada por período do dia, busca integrada
  e botão "Descobrir" (sorteia um livro do acervo)
- **Temas em alta** — gerados dinamicamente a partir dos assuntos dos
  livros mais emprestados nos últimos 30 dias
- **Em alta na biblioteca** — ranking dos mais emprestados
- **Quem leu X, também leu** — recomendações por co-empréstimo
- **Desafio das turmas** — ranking coletivo por sala
- **Explore por temas** — 11 estantes temáticas navegáveis por filtro
- **Novos no acervo** — últimos títulos adicionados
- **Clube da leitura** — ranking individual do mês
- **Devoluções em atraso** — visível apenas para usuários logados

### 🎨 Tema visual global (reestruturação do CSS)

A camada de estilo do Biblivre foi **reorganizada sob um tema moderno
central** (`biblivre.modern.css`), carregado por último e sobrepondo o
CSS base. As mudanças incluem:

- Fonte editorial (Lora para títulos, Inter para corpo)
- Paleta sóbria (tinta, papel, bronze, bordô)
- Cabeçalho com **auto-hide** (sobe ao tirar o mouse, desce ao passar na
  faixa superior da tela)
- Layout responsivo (desktop, tablet, mobile)
- Acessibilidade: foco visível, contraste AA, `prefers-reduced-motion`
- Botões, formulários, abas, paginação, mensagens e tabelas repaginados

### 🧭 Navegação

- Item **"Início"** adicionado ao menu do cabeçalho, presente em todas
  as páginas, com detecção automática da URL base (funciona em qualquer
  domínio ou subpasta)

### 📱 Correção mobile

- `meta viewport` corrigido via JavaScript para garantir que o layout
  responsivo funcione em celulares (o Biblivre originalmente injeta um
  viewport errado que faz o site ser renderizado em 980px)

### 🖼️ Capa por registro

Cada registro bibliográfico tem **sua própria capa**, enviada na tela de
Catalogação — como em outros sistemas de gestão de acervo. A antiga
"gambiarra" que tentava adivinhar a capa cruzando o título do livro com os
arquivos digitais foi removida.

- **Onde enviar:** Catalogação → abra o registro → aba *Resumo* → bloco
  **Capa do livro**. Dá para clicar em *Enviar capa*, arrastar a imagem até
  a capa ou reaproveitar uma imagem que já esteja anexada ao registro.
- **Trocar / remover:** no mesmo bloco.
- **Tamanho:** a imagem é reduzida no navegador para no máximo 600×900 px
  (JPEG), então foto de celular funciona e o banco não incha.
- **Onde aparece:** home (todas as vitrines), resultados da Pesquisa e da
  Catalogação e no registro aberto na Pesquisa. Livro sem capa continua
  com a capa ilustrada automática.
- **Permissão:** só quem pode *salvar* na catalogação bibliográfica envia
  ou remove capas; qualquer visitante pode vê-las.
- **Armazenamento:** tabela `capas_registro`, criada sozinha no schema da
  biblioteca no primeiro envio. Como fica dentro do schema, entra no
  backup normal do Biblivre.
- **Conexão com o banco:** `index.jsp` e `capa.jsp` usam o pool do próprio
  Biblivre (`jdbc/biblivre4`), sem senha fixa no código — por isso funciona
  em outras instalações.

Arquivos: `jsp/capa.jsp`, `static/scripts/biblivre.capas.js`, seção 14 de
`static/styles/biblivre.modern.css`, `jsp/cataloging/bibliographic.jsp`,
`jsp/search/bibliographic.jsp` e o topo do `jsp/index.jsp` (rota
`?controller=capa`).

### 🔒 Privacidade e segurança

- **Atrasos saíram da página inicial.** Agora ficam só no Painel da
  biblioteca (Administração → Relatórios), que exige login com permissão
  de relatórios. A checagem antiga de "está logado" era falha e podia
  mostrar nomes de alunos a visitantes.
- **Turma lida só do campo de turma do cadastro.** O código detecta
  sozinho um campo chamado ou rotulado "Turma" (ou classe/série/sala).
  Se não achar, só aceita valores com formato de turma (6A, 7º B).
  Telefone e e-mail nunca mais aparecem como turma. Para fixar o campo,
  edite `BIB_CAMPO_TURMA_FIXO` em `jsp/inc/biblioteca.jspf`.
- **Nome abreviado na página pública:** o Clube da leitura mostra
  "Ana C." em vez do nome completo.
- **Sem senha no código:** todas as páginas usam a conexão do próprio
  Biblivre (`jdbc/biblivre4`). A senha fica só no `context.xml` do Tomcat.
- **Erros vão para o log** do Tomcat (`catalina.out`) em vez de sumirem.

#### Trocar a senha padrão do banco (fazer no servidor)

O Biblivre vem com a senha `abracadabra`, que é pública. Para trocar:

1. No PostgreSQL: `ALTER ROLE biblivre WITH PASSWORD 'uma-senha-forte';`
   (faça o mesmo para `postgres` se ele também usa a senha padrão).
2. No Tomcat, abra o arquivo de contexto do Biblivre
   (`conf/Catalina/localhost/Biblivre4.xml` ou
   `webapps/Biblivre4/META-INF/context.xml`) e troque `password="abracadabra"`
   pela senha nova em todos os `<Resource>`.
3. Reinicie o Tomcat.

### 🎒 Filtro por faixa na página inicial

Botões "Todos / 1º ao 5º ano / 6º ano em diante" no topo da home. O
filtro vale para todas as vitrines e para os rankings de turmas e
leitores, e o navegador lembra a última escolha.

A faixa de cada livro é calculada pelo **histórico de empréstimos dos
últimos 2 anos**: se 30% ou mais das retiradas foram de turmas do 1º ao
5º ano, o livro entra nessa faixa (idem para o 6º em diante). Livros sem
histórico aparecem nas duas. Não exige catalogação extra.

### 📊 Painel da biblioteca (Administração → Relatórios)

Acima dos relatórios em PDF do Biblivre, um painel com filtros de
período (este mês, mês passado, este ano, 12 meses ou datas livres) e de
faixa de turmas:

- Resumo: empréstimos, leitores, média por leitor, % de alunos que
  leram, títulos diferentes e atrasos de hoje
- Devoluções em atraso (nome completo, turma, livro, tombo, prazo, dias)
- Comparativo mês a mês com gráfico e variação contra o ano anterior
- Turmas com mais empréstimos, com % de alunos que leram e livros por aluno
- Quem mais pegou livros (top 50)
- Livros mais emprestados (top 30)
- Assuntos mais lidos (palavras do campo de assunto 650 e afins)
- Movimento por dia da semana
- Acervo parado (sem empréstimo há mais de 1 ano)

Cada tabela tem "Exportar CSV" (abre direto no Excel) e o painel inteiro
tem versão para impressão.

Arquivos: `jsp/inc/biblioteca.jspf` (funções compartilhadas),
`jsp/inc/painel_relatorios.jspf` e `jsp/administration/reports.jsp`.

### 📐 Responsividade

- Breakpoints únicos na home: 1100 / 900 / 640 / 400 px
- Carrosséis com rolagem por "encaixe" no toque e setas no desktop
- Cards e capas com largura fluida; nada estoura a largura da tela até 320 px
- Busca do hero sem borda duplicada e sem empurrar o botão para fora
- Selo *Disponível/Emprestado* preservado também nas capas ilustradas

---

## Estrutura do repositório
