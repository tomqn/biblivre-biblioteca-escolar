<%@page import="java.sql.*"%>
<%@page import="java.util.*"%>
<%@page import="java.text.Normalizer"%>
<%@page contentType="text/html" pageEncoding="UTF-8" %>
<%!
    private void closeQuietly(ResultSet rs) {
        if (rs != null) try { rs.close(); } catch (Exception ignored) {}
    }
    private void closeQuietly(Statement st) {
        if (st != null) try { st.close(); } catch (Exception ignored) {}
    }
    private void closeQuietly(Connection c) {
        if (c != null) try { c.close(); } catch (Exception ignored) {}
    }

    private String codificarBase64(String texto) {
        try {
            return java.util.Base64.getEncoder().encodeToString(texto.getBytes("UTF-8"));
        } catch (Throwable t) {
            try {
                return org.apache.commons.codec.binary.Base64.encodeBase64String(texto.getBytes("UTF-8"));
            } catch (Throwable t2) {
                return "";
            }
        }
    }

    private String normalizarTexto(String s) {
        if (s == null) return "";
        String nfd = Normalizer.normalize(s.toLowerCase(), Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{InCombiningDiacriticalMarks}+", "").replaceAll("[^a-z0-9]", "");
    }

    private static class MediaItem {
        int id;
        String name;
        String normalizedName;
        MediaItem(int id, String name, String normalizedName) {
            this.id = id;
            this.name = name;
            this.normalizedName = normalizedName;
        }
    }

    private List<MediaItem> carregarTodasMedias(Connection conn, String schema) {
        List<MediaItem> lista = new ArrayList<MediaItem>();
        if (conn == null) return lista;
        Statement st = null;
        ResultSet rs = null;
        try {
            String sql = "SELECT id, name FROM " + schema + ".digital_media " +
                         "WHERE name ~* '\\.(jpg|jpeg|png|webp|gif)$' ORDER BY id ASC";
            st = conn.createStatement();
            rs = st.executeQuery(sql);
            while (rs.next()) {
                int id = rs.getInt("id");
                String name = rs.getString("name");
                String semExt = name.replaceFirst("(?i)\\.(jpg|jpeg|png|webp|gif)$", "");
                lista.add(new MediaItem(id, name, normalizarTexto(semExt)));
            }
        } catch (Exception ignored) {
        } finally {
            closeQuietly(rs);
            closeQuietly(st);
        }
        return lista;
    }

    private String obterTitulo(Connection conn, String schema, int recordId) {
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            ps = conn.prepareStatement(
                "SELECT phrase FROM " + schema + ".biblio_idx_sort WHERE record_id = ? AND indexing_group_id = 3 LIMIT 1");
            ps.setInt(1, recordId);
            rs = ps.executeQuery();
            if (rs.next()) return rs.getString("phrase");
        } catch (Exception ignored) {
        } finally {
            closeQuietly(rs);
            closeQuietly(ps);
        }
        return null;
    }

    private String obterUrlCapa(Connection conn, String schema, int recordId, String titulo, List<MediaItem> todasMedias) {
        if (conn == null || todasMedias == null || todasMedias.isEmpty()) return null;

        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            String sqlMarc = "SELECT iso2709::text AS marc_data FROM " + schema + ".biblio_records WHERE id = ?";
            ps = conn.prepareStatement(sqlMarc);
            ps.setInt(1, recordId);
            rs = ps.executeQuery();
            if (rs.next()) {
                String marcData = rs.getString("marc_data");
                if (marcData != null) {
                    for (MediaItem m : todasMedias) {
                        if (marcData.contains(m.name) || marcData.contains(m.id + ":" + m.name)) {
                            return "DigitalMediaController/?id=" + codificarBase64(m.id + ":" + m.name);
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        } finally {
            closeQuietly(rs);
            closeQuietly(ps);
        }

        if (titulo != null && !titulo.isEmpty()) {
            String tituloNorm = normalizarTexto(titulo);
            for (MediaItem m : todasMedias) {
                if (m.normalizedName.length() >= 3) {
                    if (tituloNorm.equals(m.normalizedName) ||
                        tituloNorm.contains(m.normalizedName) ||
                        m.normalizedName.contains(tituloNorm)) {
                        return "DigitalMediaController/?id=" + codificarBase64(m.id + ":" + m.name);
                    }
                }
            }
        }
        return null;
    }
%>
<%
    // ============================================================
    // capa.jsp — resolve a URL da capa por record_id via JDBC direto,
    // contornando o motor de busca compilado (CatalogingHandler).
    // Uso: <img src="capa.jsp?id=123" onerror="...">
    // ============================================================

    response.setHeader("Cache-Control", "no-store"); // evita capa errada ficar em cache do navegador durante os testes

    int recordId = -1;
    try {
        recordId = Integer.parseInt(request.getParameter("id"));
    } catch (Exception e) {
        response.sendError(HttpServletResponse.SC_BAD_REQUEST);
        return;
    }

    // Tenta obter o schema da mesma forma que o resto da aplicação;
    // se seu ambiente expõe de outra forma, ajuste esta linha.
    String schema = (String) request.getAttribute("schema");
    if (schema == null || schema.isEmpty()) {
        schema = request.getParameter("schema"); // fallback, caso precise passar explicitamente
    }
    if (schema == null || schema.isEmpty()) {
        response.sendError(HttpServletResponse.SC_NOT_FOUND);
        return;
    }

    Connection conn = null;
    try {
        Class.forName("org.postgresql.Driver");
        conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/biblivre4", "postgres", "abracadabra");

        String titulo = obterTitulo(conn, schema, recordId);
        List<MediaItem> todasMedias = carregarTodasMedias(conn, schema);
        String capaUrl = obterUrlCapa(conn, schema, recordId, titulo, todasMedias);

        if (capaUrl != null) {
            response.sendRedirect(capaUrl);
        } else {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    } catch (Exception e) {
        response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
    } finally {
        closeQuietly(conn);
    }
%>
