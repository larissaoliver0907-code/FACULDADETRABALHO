package com.educonnect.service.relatorio;

import com.educonnect.dto.RelatorioDTO;
import com.educonnect.exception.RecursoNaoEncontradoException;
import com.educonnect.exception.RegraNegocioException;
import com.educonnect.model.Aluno;
import com.educonnect.model.Curso;
import com.educonnect.model.Fixtures;
import com.educonnect.model.Turma;
import com.educonnect.repository.AlunoRepository;
import com.educonnect.repository.CursoRepository;
import com.educonnect.repository.TurmaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RelatorioTest {

    @Test
    @DisplayName("Relatório de cursos usa o gerarRelatorio() polimórfico de cada subclasse")
    void relatorioCursos() {
        CursoRepository repo = mock(CursoRepository.class);
        when(repo.findAll(any(Sort.class))).thenReturn(List.of(Fixtures.cursoPresencial(), Fixtures.cursoEad()));

        RelatorioDTO.Response r = new RelatorioCursos(repo).gerarRelatorio(RelatorioDTO.Filtro.vazio());

        assertThat(r.tipo()).isEqualTo("cursos");
        assertThat(r.linhas()).hasSize(2);
        assertThat(r.linhas()).extracting(l -> l.get("Local das aulas"))
                .containsExactly("Sala B-204", "Plataforma Moodle");
        assertThat(r.resumo()).containsEntry("Total de registros", 2).containsEntry("EAD", 1L);
    }

    @Test
    @DisplayName("Relatório de alunos e de turmas trazem colunas e resumo específicos")
    @SuppressWarnings("unchecked")
    void relatorioAlunosETurmas() {
        Curso curso = Fixtures.cursoPresencial();
        Turma turma = new Turma("T1", curso, 4);
        Aluno ativo = Fixtures.aluno("A001", curso);
        Aluno inativo = Fixtures.aluno("A002", curso);
        turma.adicionarAluno(ativo);
        inativo.desativar();

        AlunoRepository alunos = mock(AlunoRepository.class);
        when(alunos.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(ativo, inativo));
        RelatorioDTO.Response ra = new RelatorioAlunos(alunos).gerarRelatorio(RelatorioDTO.Filtro.vazio());
        assertThat(ra.colunas()).containsExactly("Matrícula", "Nome", "Curso", "Turmas", "Situação");
        assertThat(ra.resumo()).containsEntry("Ativos", 1L).containsEntry("Inativos", 1L);

        TurmaRepository turmas = mock(TurmaRepository.class);
        when(turmas.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(turma));
        RelatorioDTO.Response rt = new RelatorioTurmas(turmas).gerarRelatorio(RelatorioDTO.Filtro.vazio());
        assertThat(rt.linhas().get(0)).containsEntry("Matriculados", 1).containsEntry("Ocupação (%)", 25L);
        assertThat(rt.resumo()).containsEntry("Matrículas", 1).containsEntry("Vagas totais", 4);
    }

    @Test
    @DisplayName("Serviço seleciona o gerador pelo tipo e valida filtros")
    void servicoDeRelatorios() {
        CursoRepository repo = mock(CursoRepository.class);
        when(repo.findAll(any(Sort.class))).thenReturn(List.of());
        RelatorioService service = new RelatorioService(List.of(new RelatorioCursos(repo)));

        assertThat(service.tiposDisponiveis()).extracting(RelatorioDTO.TipoDisponivel::tipo).containsExactly("cursos");
        assertThat(service.gerar("cursos", null).linhas()).isEmpty();
        assertThatThrownBy(() -> service.gerar("inexistente", null)).isInstanceOf(RecursoNaoEncontradoException.class);
        assertThatThrownBy(() -> service.gerar("cursos",
                new RelatorioDTO.Filtro(null, null, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 1, 1))))
                .isInstanceOf(RegraNegocioException.class);
    }

    @Test
    @DisplayName("Exporta CSV com cabeçalho, separador ; e proteção contra injeção de fórmulas")
    void exportaCsv() {
        LinkedHashMap<String, Object> linha = new LinkedHashMap<>();
        linha.put("Nome", "=HYPERLINK(\"x\")");
        linha.put("Nota", new java.math.BigDecimal("7.5"));
        RelatorioDTO.Response r = new RelatorioDTO.Response("t", "Teste", List.of("Nome", "Nota"), List.of(linha),
                Map.of(), RelatorioDTO.Filtro.vazio(), LocalDateTime.now());

        String csv = new String(new ExportadorRelatorio().paraCsv(r), StandardCharsets.UTF_8);

        assertThat(csv).startsWith("﻿Nome;Nota\r\n");
        assertThat(csv).contains("\"'=HYPERLINK(\"\"x\"\")\";7,50");
        assertThat(ExportadorRelatorio.celulaCsv("-3")).isEqualTo("-3");
        assertThat(ExportadorRelatorio.celulaCsv("a;b")).isEqualTo("\"a;b\"");
    }

    @Test
    @DisplayName("Exporta PDF válido")
    void exportaPdf() {
        RelatorioDTO.Response r = new RelatorioDTO.Response("t", "Teste", List.of("Coluna"), List.of(),
                Map.of("Total de registros", 0), RelatorioDTO.Filtro.vazio(), LocalDateTime.now());
        byte[] pdf = new ExportadorRelatorio().paraPdf(r);
        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }
}
