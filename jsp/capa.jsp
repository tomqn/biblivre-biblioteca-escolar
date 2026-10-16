<%@page contentType="text/plain" pageEncoding="UTF-8" trimDirectiveWhitespaces="true"%>
<%@page import="java.sql.*"%>
<%@page import="java.io.*"%>
<%@page import="javax.imageio.ImageIO"%>
<%@page import="java.awt.image.BufferedImage"%>
<%@page import="org.apache.commons.codec.binary.Base64"%>
<%@page import="biblivre.core.ExtendedRequest"%>
<%@page import="biblivre.core.auth.AuthorizationPoints"%>
<%@ include file="/jsp/inc/biblioteca.jspf" %>
<%!
    /* =================================================================
       capa.jsp — capa própria de cada registro bibliográfico
       =================================================================
       Não é acessado direto pelo navegador: o index.jsp encaminha para
       cá toda requisição com ?controller=capa (ver topo do index.jsp).
       Assim a URL funciona em qualquer instalação/pasta/schema.

         GET  ?controller=capa&id=123[&v=...]     → imagem (ou 404)
         GET  ?controller=capa&action=info&id=123 → JSON {exists, v}
         POST ?controller=capa  action=save&id=123&data=<dataURL>
         POST ?controller=capa  action=delete&id=123

       As imagens ficam na tabela <schema>.capas_registro (criada
       automaticamente). Por estar dentro do schema da biblioteca, entra
       no backup normal do Biblivre.
       ================================================================= */

    private static final int TAMANHO_MAXIMO = 3 * 1024 * 1024; // 3 MB já decodificado

    private void fechar(Object o) {
        if (o == null) return;
        try {
            if (o instanceof ResultSet) ((ResultSet) o).close();
            else if (o instanceof Statement) ((Statement) o).close();
            else if (o instanceof Connection) ((Connection) o).close();
        } catch (Exception ignored) {}
    }

    private void garantirTabela(Connection conn, String schema) throws SQLException {
        Statement st = conn.createStatement();
        try {
            st.execute("CREATE TABLE IF NOT EXISTS " + schema + ".capas_registro (" +
                       " record_id integer PRIMARY KEY," +
                       " conteudo bytea NOT NULL," +
                       " tipo varchar(40) NOT NULL," +
                       " largura integer," +
                       " altura integer," +
                       " tamanho integer," +
                       " atualizado timestamp NOT NULL DEFAULT now()," +
                       " atualizado_por integer)");
        } finally {
            fechar(st);
        }
    }

    private boolean podeEditar(HttpServletRequest request, String schema) {
        try {
            HttpSession sess = request.getSession(false);
            if (sess == null) return false;
            Object atps = sess.getAttribute(schema + ".logged_user_atps");
            if (!(atps instanceof AuthorizationPoints)) return false;
            return ((AuthorizationPoints) atps).isAllowed("cataloging.bibliographic", "save");
        } catch (Throwable t) {
            return false;
        }
    }

    private String json(boolean ok, String mensagem, String extra) {
        StringBuilder sb = new StringBuilder("{\"success\":").append(ok);
        if (mensagem != null) {
            sb.append(",\"message\":\"").append(mensagem.replace("\\", "\\\\").replace("\"", "\\\"")).append("\"");
        }
        if (extra != null) sb.append(",").append(extra);
        return sb.append("}").toString();
    }

    private String detectarTipo(byte[] b) {
        if (b.length > 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "image/jpeg";
        if (b.length > 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "image/png";
        if (b.length > 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
        return null;
    }
%>
<%
    out.clear();
    response.setCharacterEncoding("UTF-8");

    // Schema: o index.jsp deixa pronto em "capa_schema"; senão tenta o do Biblivre.
    String schema = (String) request.getAttribute("capa_schema");
    if (schema == null && request instanceof ExtendedRequest) {
        try { schema = ((ExtendedRequest) request).getSchema(); } catch (Throwable ignored) {}
    }
    if (schema == null || !schema.matches("[A-Za-z_][A-Za-z0-9_]*")) {
        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        return;
    }

    String action = request.getParameter("action");
    if (action == null) action = "";
    boolean isPost = "POST".equalsIgnoreCase(request.getMethod());

    int recordId;
    try {
        recordId = Integer.parseInt(request.getParameter("id"));
    } catch (Exception e) {
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        return;
    }

    Connection conn = null;
    PreparedStatement ps = null;
    ResultSet rs = null;

    try {
        conn = bibConexao(); // pool do Biblivre, sem senha no código

        // ---------------------------------------------------------------
        // ESCRITA (salvar / remover) — só quem pode salvar catalogação
        // ---------------------------------------------------------------
        if (isPost && ("save".equals(action) || "delete".equals(action))) {
            response.setContentType("application/json;charset=UTF-8");
            response.setHeader("Cache-Control", "no-store");

            if (!podeEditar(request, schema)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                out.print(json(false, "Você não tem permissão para alterar capas.", null));
                return;
            }

            garantirTabela(conn, schema);

            if ("delete".equals(action)) {
                ps = conn.prepareStatement("DELETE FROM " + schema + ".capas_registro WHERE record_id = ?");
                ps.setInt(1, recordId);
                ps.executeUpdate();
                out.print(json(true, "Capa removida.", "\"exists\":false"));
                return;
            }

            // save
            String data = request.getParameter("data");
            if (data == null || data.length() == 0) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print(json(false, "Nenhuma imagem recebida.", null));
                return;
            }
            int virgula = data.indexOf(',');
            if (data.startsWith("data:") && virgula > 0) data = data.substring(virgula + 1);

            byte[] bytes = Base64.decodeBase64(data);
            if (bytes == null || bytes.length == 0 || bytes.length > TAMANHO_MAXIMO) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print(json(false, "Imagem vazia ou maior que 3 MB.", null));
                return;
            }

            String tipo = detectarTipo(bytes);
            if (tipo == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print(json(false, "Formato não suportado. Use JPG, PNG ou WebP.", null));
                return;
            }

            Integer largura = null, altura = null;
            try {
                BufferedImage img = ImageIO.read(new ByteArrayInputStream(bytes));
                if (img != null) { largura = img.getWidth(); altura = img.getHeight(); }
                else if (!"image/webp".equals(tipo)) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print(json(false, "O arquivo não parece ser uma imagem válida.", null));
                    return;
                }
            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print(json(false, "O arquivo não parece ser uma imagem válida.", null));
                return;
            }

            // registro existe?
            ps = conn.prepareStatement("SELECT 1 FROM " + schema + ".biblio_records WHERE id = ?");
            ps.setInt(1, recordId);
            rs = ps.executeQuery();
            boolean existe = rs.next();
            fechar(rs); rs = null;
            fechar(ps); ps = null;
            if (!existe) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print(json(false, "Registro não encontrado.", null));
                return;
            }

            int usuario = 0;
            if (request instanceof ExtendedRequest) {
                try { usuario = ((ExtendedRequest) request).getLoggedUserId(); } catch (Throwable ignored) {}
            }

            // UPDATE e, se não havia capa, INSERT (compatível com PostgreSQL < 9.5)
            ps = conn.prepareStatement("UPDATE " + schema + ".capas_registro SET conteudo = ?, tipo = ?, largura = ?, altura = ?, " +
                                       "tamanho = ?, atualizado = now(), atualizado_por = ? WHERE record_id = ?");
            ps.setBytes(1, bytes);
            ps.setString(2, tipo);
            if (largura != null) ps.setInt(3, largura); else ps.setNull(3, Types.INTEGER);
            if (altura != null) ps.setInt(4, altura); else ps.setNull(4, Types.INTEGER);
            ps.setInt(5, bytes.length);
            ps.setInt(6, usuario);
            ps.setInt(7, recordId);
            int alterados = ps.executeUpdate();
            fechar(ps); ps = null;

            if (alterados == 0) {
                ps = conn.prepareStatement("INSERT INTO " + schema + ".capas_registro " +
                                           "(record_id, conteudo, tipo, largura, altura, tamanho, atualizado_por) VALUES (?, ?, ?, ?, ?, ?, ?)");
                ps.setInt(1, recordId);
                ps.setBytes(2, bytes);
                ps.setString(3, tipo);
                if (largura != null) ps.setInt(4, largura); else ps.setNull(4, Types.INTEGER);
                if (altura != null) ps.setInt(5, altura); else ps.setNull(5, Types.INTEGER);
                ps.setInt(6, bytes.length);
                ps.setInt(7, usuario);
                ps.executeUpdate();
                fechar(ps); ps = null;
            }

            ps = conn.prepareStatement("SELECT CAST(EXTRACT(EPOCH FROM atualizado) * 1000 AS bigint) AS v FROM " + schema + ".capas_registro WHERE record_id = ?");
            ps.setInt(1, recordId);
            rs = ps.executeQuery();
            long versao = rs.next() ? rs.getLong("v") : System.currentTimeMillis();
            out.print(json(true, "Capa salva.", "\"exists\":true,\"v\":" + versao));
            return;
        }

        // ---------------------------------------------------------------
        // INFO — usado pelo painel de catalogação
        // ---------------------------------------------------------------
        if ("info".equals(action)) {
            response.setContentType("application/json;charset=UTF-8");
            response.setHeader("Cache-Control", "no-store");
            boolean editavel = podeEditar(request, schema);
            try {
                ps = conn.prepareStatement("SELECT CAST(EXTRACT(EPOCH FROM atualizado) * 1000 AS bigint) AS v, largura, altura, tamanho " +
                                           "FROM " + schema + ".capas_registro WHERE record_id = ?");
                ps.setInt(1, recordId);
                rs = ps.executeQuery();
                if (rs.next()) {
                    out.print(json(true, null, "\"exists\":true,\"v\":" + rs.getLong("v") +
                                               ",\"width\":" + rs.getInt("largura") +
                                               ",\"height\":" + rs.getInt("altura") +
                                               ",\"size\":" + rs.getInt("tamanho") +
                                               ",\"editable\":" + editavel));
                    return;
                }
            } catch (SQLException tabelaAindaNaoExiste) { }
            out.print(json(true, null, "\"exists\":false,\"editable\":" + editavel));
            return;
        }

        // ---------------------------------------------------------------
        // IMAGEM
        // ---------------------------------------------------------------
        byte[] conteudo = null;
        String tipo = null;
        long versao = 0;
        try {
            ps = conn.prepareStatement("SELECT conteudo, tipo, CAST(EXTRACT(EPOCH FROM atualizado) * 1000 AS bigint) AS v " +
                                       "FROM " + schema + ".capas_registro WHERE record_id = ?");
            ps.setInt(1, recordId);
            rs = ps.executeQuery();
            if (rs.next()) {
                conteudo = rs.getBytes("conteudo");
                tipo = rs.getString("tipo");
                versao = rs.getLong("v");
            }
        } catch (SQLException tabelaAindaNaoExiste) { }

        if (conteudo == null) {
            response.setHeader("Cache-Control", "no-cache");
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String etag = "\"capa-" + recordId + "-" + versao + "\"";
        if (request.getParameter("v") != null) {
            // URL com versão → pode ficar em cache por muito tempo
            response.setHeader("Cache-Control", "public, max-age=31536000");
        } else {
            response.setHeader("Cache-Control", "no-cache");
        }
        response.setHeader("ETag", etag);
        response.setDateHeader("Last-Modified", (versao / 1000) * 1000);

        if (etag.equals(request.getHeader("If-None-Match"))) {
            response.setStatus(HttpServletResponse.SC_NOT_MODIFIED);
            return;
        }

        response.setContentType(tipo);
        response.setContentLength(conteudo.length);
        OutputStream os = response.getOutputStream();
        os.write(conteudo);
        os.flush();
        return;

    } catch (Exception e) {
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        if (isPost || "info".equals(action)) {
            response.setContentType("application/json;charset=UTF-8");
            try { out.print(json(false, "Erro ao acessar o banco: " + e.getMessage(), null)); } catch (Exception ignored) {}
        }
    } finally {
        fechar(rs);
        fechar(ps);
        fechar(conn);
    }
%>
