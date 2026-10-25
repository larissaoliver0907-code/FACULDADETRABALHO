package com.educonnect.model;

import com.educonnect.exception.RegraNegocioException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CursoHerancaTest {

    @Test
    @DisplayName("CursoPresencial e CursoEAD herdam de Curso")
    void heranca() {
        assertThat(Curso.class).isAbstract();
        assertThat(new CursoPresencial("ADS", "ADS", 100, null, "B1")).isInstanceOf(Curso.class);
        assertThat(new CursoEAD("GTI", "GTI", 100, null, "Moodle")).isInstanceOf(Curso.class);
    }

    @Test
    @DisplayName("Polimorfismo: cada modalidade informa o próprio local das aulas e relatório")
    void polimorfismo() {
        List<Curso> cursos = List.of(Fixtures.cursoPresencial(), Fixtures.cursoEad());

        assertThat(cursos).extracting(Curso::getModalidade)
                .containsExactly(ModalidadeCurso.PRESENCIAL, ModalidadeCurso.EAD);
        assertThat(cursos).extracting(Curso::getLocalAulas)
                .containsExactly("Sala B-204", "Plataforma Moodle");

        for (Curso curso : cursos) {
            assertThat(curso.gerarRelatorio())
                    .containsKeys("Código", "Nome", "Modalidade", "Carga horária (h)", "Status", "Local das aulas");
        }
        assertThat(cursos.get(1).gerarRelatorio()).containsEntry("Modalidade", "EAD");
    }

    @Test
    @DisplayName("Valida atributos comuns e específicos de cada modalidade")
    void validacoes() {
        assertThatThrownBy(() -> new CursoPresencial("ADS", "ADS", 100, null, " "))
                .isInstanceOf(RegraNegocioException.class).hasMessageContaining("sala");
        assertThatThrownBy(() -> new CursoEAD("GTI", "GTI", 100, null, null))
                .isInstanceOf(RegraNegocioException.class).hasMessageContaining("plataforma");
        assertThatThrownBy(() -> new CursoEAD("GTI", "GTI", 0, null, "Moodle"))
                .isInstanceOf(RegraNegocioException.class).hasMessageContaining("carga horária");
        assertThatThrownBy(() -> new CursoEAD("", "GTI", 10, null, "Moodle"))
                .isInstanceOf(RegraNegocioException.class);
    }

    @Test
    @DisplayName("Curso inativo não aceita novos vínculos")
    void cursoInativo() {
        Curso curso = Fixtures.cursoPresencial();
        curso.inativar();
        assertThat(curso.isAtivo()).isFalse();
        assertThatThrownBy(() -> new Turma("T1", curso, 10)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> Fixtures.aluno("A001", curso)).isInstanceOf(RegraNegocioException.class);
    }
}
