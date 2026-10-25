package com.educonnect.model;

import com.educonnect.exception.RegraNegocioException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AvaliacaoTest {

    private Aluno aluno;
    private Turma turma;

    @BeforeEach
    void setUp() {
        Curso curso = Fixtures.cursoPresencial();
        turma = new Turma("T1", curso, 10);
        aluno = Fixtures.aluno("A001", curso);
        turma.adicionarAluno(aluno);
    }

    private Avaliacao avaliacao(String nota) {
        return new Avaliacao(aluno, turma, "Prova 1", new BigDecimal(nota), LocalDate.now());
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "0.00", "5.5", "7.25", "10", "10.00"})
    @DisplayName("Aceita notas entre 0 e 10")
    void aceitaNotasValidas(String nota) {
        assertThat(avaliacao(nota).getNota()).isEqualByComparingTo(nota);
    }

    @ParameterizedTest
    @ValueSource(strings = {"-0.01", "-1", "10.01", "11", "100"})
    @DisplayName("Rejeita nota menor que 0 ou maior que 10")
    void rejeitaNotasForaDoIntervalo(String nota) {
        assertThatThrownBy(() -> avaliacao(nota))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("entre 0 e 10");
    }

    @Test
    @DisplayName("atribuirNota rejeita valores inválidos sem alterar a nota atual")
    void atribuirNotaPreservaValorAnterior() {
        Avaliacao av = avaliacao("8");
        assertThatThrownBy(() -> av.atribuirNota(-1)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> av.atribuirNota(10.5)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> av.atribuirNota(Double.NaN)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> av.atribuirNota(new BigDecimal("7.333"))).isInstanceOf(RegraNegocioException.class);
        assertThat(av.getNota()).isEqualByComparingTo("8");

        av.atribuirNota(9.5);
        assertThat(av.getNota()).isEqualByComparingTo("9.5");
    }

    @Test
    @DisplayName("Nota é privada e não possui setter público")
    void encapsulamentoDaNota() throws NoSuchFieldException {
        Field nota = Avaliacao.class.getDeclaredField("nota");
        Field descricao = Avaliacao.class.getDeclaredField("descricao");
        assertThat(Modifier.isPrivate(nota.getModifiers())).isTrue();
        assertThat(Modifier.isPrivate(descricao.getModifiers())).isTrue();
        assertThat(Arrays.stream(Avaliacao.class.getMethods()).map(Method::getName))
                .doesNotContain("setNota", "setDescricao");
    }

    @Test
    @DisplayName("Exige que o aluno esteja matriculado na turma")
    void exigeMatricula() {
        Aluno naoMatriculado = Fixtures.aluno("A002", turma.getCurso());
        assertThatThrownBy(() -> new Avaliacao(naoMatriculado, turma, "Prova", BigDecimal.ONE, LocalDate.now()))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("não está matriculado");
    }

    @Test
    @DisplayName("Rejeita descrição vazia e data futura")
    void validaDescricaoEData() {
        assertThatThrownBy(() -> new Avaliacao(aluno, turma, " ", BigDecimal.ONE, LocalDate.now()))
                .isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> new Avaliacao(aluno, turma, "Prova", BigDecimal.ONE, LocalDate.now().plusDays(1)))
                .isInstanceOf(RegraNegocioException.class);
    }
}
