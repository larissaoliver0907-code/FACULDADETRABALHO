package com.educonnect.service.relatorio;

import com.educonnect.dto.RelatorioDTO;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/** Exporta um {@link RelatorioDTO.Response} para CSV (compatível com Excel em português) e PDF. */
@Component
public class ExportadorRelatorio {

    private static final char SEPARADOR = ';';
    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Color AZUL_MARINHO = new Color(15, 33, 71);

    // ---------------------------------------------------------------- CSV

    public byte[] paraCsv(RelatorioDTO.Response relatorio) {
        StringBuilder sb = new StringBuilder();
        sb.append('﻿'); // BOM para o Excel reconhecer UTF-8
        sb.append(String.join(String.valueOf(SEPARADOR), relatorio.colunas().stream().map(ExportadorRelatorio::celulaCsv).toList()))
                .append("\r\n");
        for (Map<String, Object> linha : relatorio.linhas()) {
            for (int i = 0; i < relatorio.colunas().size(); i++) {
                if (i > 0) sb.append(SEPARADOR);
                sb.append(celulaCsv(formatar(linha.get(relatorio.colunas().get(i)))));
            }
            sb.append("\r\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Escapa aspas e protege contra injeção de fórmulas (CSV injection): textos iniciados por
     * =, +, -, @, tab ou CR recebem um apóstrofo inicial.
     */
    static String celulaCsv(String valor) {
        if (valor == null) return "";
        String v = valor;
        if (!v.isEmpty() && "=+-@\t\r".indexOf(v.charAt(0)) >= 0 && !v.matches("^-?\\d+([.,]\\d+)?$")) {
            v = "'" + v;
        }
        boolean precisaAspas = v.indexOf(SEPARADOR) >= 0 || v.contains("\"") || v.contains("\n") || v.contains("\r");
        v = v.replace("\"", "\"\"");
        return precisaAspas ? "\"" + v + "\"" : v;
    }

    // ---------------------------------------------------------------- PDF

    public byte[] paraPdf(RelatorioDTO.Response relatorio) {
        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        Document documento = new Document(PageSize.A4.rotate(), 28, 28, 28, 28);
        try {
            PdfWriter.getInstance(documento, saida);
            documento.open();

            Font titulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, AZUL_MARINHO);
            Font normal = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.DARK_GRAY);
            Font cabecalho = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font celula = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, Color.BLACK);

            documento.add(new Paragraph("EduConnect — " + relatorio.titulo(), titulo));
            documento.add(new Paragraph("Gerado em " + relatorio.geradoEm().format(DATA_HORA) + descreverFiltro(relatorio.filtro()), normal));

            if (relatorio.resumo() != null && !relatorio.resumo().isEmpty()) {
                StringBuilder resumo = new StringBuilder();
                relatorio.resumo().forEach((k, v) -> resumo.append(k).append(": ").append(formatar(v)).append("   "));
                Paragraph p = new Paragraph(resumo.toString().trim(), normal);
                p.setSpacingBefore(6);
                documento.add(p);
            }

            PdfPTable tabela = new PdfPTable(relatorio.colunas().size());
            tabela.setWidthPercentage(100);
            tabela.setSpacingBefore(10);
            tabela.setHeaderRows(1);
            for (String coluna : relatorio.colunas()) {
                PdfPCell c = new PdfPCell(new Phrase(coluna, cabecalho));
                c.setBackgroundColor(AZUL_MARINHO);
                c.setPadding(5);
                tabela.addCell(c);
            }
            boolean alternar = false;
            for (Map<String, Object> linha : relatorio.linhas()) {
                for (String coluna : relatorio.colunas()) {
                    PdfPCell c = new PdfPCell(new Phrase(formatar(linha.get(coluna)), celula));
                    c.setPadding(4);
                    if (alternar) c.setBackgroundColor(new Color(241, 245, 252));
                    Object valor = linha.get(coluna);
                    if (valor instanceof Number) c.setHorizontalAlignment(Element.ALIGN_RIGHT);
                    tabela.addCell(c);
                }
                alternar = !alternar;
            }
            if (relatorio.linhas().isEmpty()) {
                PdfPCell vazio = new PdfPCell(new Phrase("Nenhum registro encontrado para os filtros informados.", celula));
                vazio.setColspan(relatorio.colunas().size());
                vazio.setPadding(8);
                tabela.addCell(vazio);
            }
            documento.add(tabela);
        } catch (DocumentException e) {
            throw new IllegalStateException("Falha ao gerar o PDF do relatório.", e);
        } finally {
            documento.close();
        }
        return saida.toByteArray();
    }

    private static String descreverFiltro(RelatorioDTO.Filtro f) {
        if (f == null) return "";
        StringBuilder sb = new StringBuilder();
        if (f.inicio() != null) sb.append(" · desde ").append(f.inicio().format(DATA));
        if (f.fim() != null) sb.append(" · até ").append(f.fim().format(DATA));
        if (f.cursoId() != null) sb.append(" · filtrado por curso");
        if (f.turmaId() != null) sb.append(" · filtrado por turma");
        return sb.toString();
    }

    static String formatar(Object valor) {
        if (valor == null) return "";
        if (valor instanceof BigDecimal bd) return bd.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString().replace('.', ',');
        if (valor instanceof LocalDate d) return d.format(DATA);
        return String.valueOf(valor);
    }
}
