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

---

## Estrutura do repositório
