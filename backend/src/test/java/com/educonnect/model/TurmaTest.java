package com.educonnect.model;

import com.educonnect.exception.RegraNegocioException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TurmaTest {

    private CursoPresencial curso;
    private Turma turma;

    @BeforeEach
    void setUp() {
        curso = Fixtures.cursoPresencial();
        turma = new Turma("ads-2026a", curso, 2);
    }

    @Test
    @DisplayName("Cria turma com código normalizado, curso e status aberta")
    void criacaoDeTurma() {
        assertThat(turma.getCodigo()).isEqualTo("ADS-2026A");
        assertThat(turma.getCurso()).isSameAs(curso);
        assertThat(turma.getStatus()).isEqualTo(StatusTurma.ABERTA);
        assertThat(turma.getQuantidadeMatriculados()).isZero();
        assertThat(turma.getVagasDisponiveis()).isEqualTo(2);
    }

    @Test
    @DisplayName("Rejeita turma sem curso ou com capacidade inválida")
    void criacaoInvalida() {
        assertThatThrownBy(() -> new Turma("T1", null, 10)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> new Turma("T1", curso, 0)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> new Turma("código inválido!", curso, 10)).isInstanceOf(RegraNegocioException.class);
    }

    @Test
    @DisplayName("Inclui e remove alunos mantendo os dois lados da associação")
    void inclusaoERemocao() {
        Aluno aluno = Fixtures.aluno("A001", curso);

        turma.adicionarAluno(aluno);
        assertThat(turma.possuiAluno(aluno)).isTrue();
        assertThat(turma.getQuantidadeMatriculados()).isEqualTo(1);
        assertThat(aluno.getTurmas()).contains(turma);

        turma.removerAluno(aluno);
        assertThat(turma.possuiAluno(aluno)).isFalse();
        assertThat(turma.getQuantidadeMatriculados()).isZero();
        assertThat(aluno.getTurmas()).doesNotContain(turma);
    }

    @Test
    @DisplayName("Bloqueia matrícula duplicada")
    void bloqueiaDuplicada() {
        Aluno aluno = Fixtures.aluno("A001", curso);
        turma.adicionarAluno(aluno);

        assertThatThrownBy(() -> turma.adicionarAluno(aluno))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("já está matriculado");
        assertThat(turma.getQuantidadeMatriculados()).isEqualTo(1);
    }

    @Test
    @DisplayName("Bloqueia matrícula em turma lotada")
    void bloqueiaLotada() {
        turma.adicionarAluno(Fixtures.aluno("A001", curso));
        turma.adicionarAluno(Fixtures.aluno("A002", curso));
        assertThat(turma.isLotada()).isTrue();

        assertThatThrownBy(() -> turma.adicionarAluno(Fixtures.aluno("A003", curso)))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("lotada");
        assertThat(turma.getQuantidadeMatriculados()).isEqualTo(2);
    }

    @Test
    @DisplayName("Impede remover aluno que não está matriculado")
    void removerNaoMatriculado() {
        assertThatThrownBy(() -> turma.removerAluno(Fixtures.aluno("A009", curso)))
                .isInstanceOf(RegraNegocioException.class);
    }

    @Test
    @DisplayName("Impede matrícula de aluno inativo, de outro curso ou em turma encerrada")
    void associacoesInconsistentes() {
        Aluno inativo = Fixtures.aluno("A001", curso);
        inativo.desativar();
        assertThatThrownBy(() -> turma.adicionarAluno(inativo)).hasMessageContaining("inativo");

        Aluno outroCurso = Fixtures.aluno("A002", Fixtures.cursoEad());
        assertThatThrownBy(() -> turma.adicionarAluno(outroCurso)).hasMessageContaining("curso");

        turma.alterarStatus(StatusTurma.ENCERRADA);
        assertThatThrownBy(() -> turma.adicionarAluno(Fixtures.aluno("A003", curso))).hasMessageContaining("não está aberta");
    }

    @Test
    @DisplayName("Associa professor somente se ele leciona no curso da turma")
    void associarProfessor() {
        Professor doCurso = Fixtures.professorDo(curso);
        turma.associarProfessor(doCurso);
        assertThat(turma.getProfessor()).isSameAs(doCurso);
        assertThat(doCurso.getTurmas()).contains(turma);

        Professor deOutroCurso = Fixtures.professorDo(Fixtures.cursoEad());
        assertThatThrownBy(() -> turma.associarProfessor(deOutroCurso))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("não está associado");
    }

    @Test
    @DisplayName("Capacidade não pode ficar abaixo do número de matriculados")
    void capacidadeMinima() {
        turma.adicionarAluno(Fixtures.aluno("A001", curso));
        turma.adicionarAluno(Fixtures.aluno("A002", curso));
        assertThatThrownBy(() -> turma.alterarCapacidade(1)).isInstanceOf(RegraNegocioException.class);
    }

    @Test
    @DisplayName("Resumo e relatório da turma refletem os dados atuais")
    void resumoERelatorio() {
        turma.adicionarAluno(Fixtures.aluno("A001", curso));
        assertThat(turma.getResumo()).contains("ADS-2026A").contains("1/2 alunos").contains("sem professor");
        assertThat(turma.gerarRelatorio())
                .containsEntry("Código", "ADS-2026A")
                .containsEntry("Matriculados", 1)
                .containsEntry("Ocupação (%)", 50L);
    }
}
