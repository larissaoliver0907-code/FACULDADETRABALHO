package com.educonnect.service;

import com.educonnect.dto.CursoDTO;
import com.educonnect.dto.ProfessorDTO;
import com.educonnect.exception.ConflitoException;
import com.educonnect.exception.RegraNegocioException;
import com.educonnect.model.Curso;
import com.educonnect.model.CursoEAD;
import com.educonnect.model.CursoPresencial;
import com.educonnect.model.Fixtures;
import com.educonnect.model.ModalidadeCurso;
import com.educonnect.model.Professor;
import com.educonnect.repository.CursoRepository;
import com.educonnect.repository.ProfessorRepository;
import com.educonnect.repository.TurmaRepository;
import com.educonnect.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProfessorCursoServiceTest {

    @Nested
    @ExtendWith(MockitoExtension.class)
    class CadastroDeProfessor {

        @Mock ProfessorRepository professorRepository;
        @Mock UsuarioRepository usuarioRepository;
        @Mock CursoRepository cursoRepository;
        @Mock TurmaRepository turmaRepository;
        @Mock PasswordEncoder passwordEncoder;
        @Mock AtividadeService atividades;
        @InjectMocks ProfessorService service;

        @Test
        @DisplayName("Cadastra professor com especialidade e cursos associados")
        void cadastroValido() {
            Curso curso = Fixtures.cursoPresencial();
            when(professorRepository.existsByRegistro("P-100")).thenReturn(false);
            when(usuarioRepository.existsByLogin("joao.prof")).thenReturn(false);
            when(cursoRepository.findAllById(Set.of(1L))).thenReturn(List.of(curso));
            when(passwordEncoder.encode("Senha123")).thenReturn("hash");
            when(professorRepository.save(any(Professor.class))).thenAnswer(inv -> inv.getArgument(0));

            ProfessorDTO.Response resposta = service.criar(new ProfessorDTO.Request(
                    "João Prof", "p-100", "Banco de Dados", "Joao.Prof", "Senha123", Set.of(1L)));

            assertThat(resposta.registro()).isEqualTo("P-100");
            assertThat(resposta.login()).isEqualTo("joao.prof");
            assertThat(resposta.especialidade()).isEqualTo("Banco de Dados");
            assertThat(resposta.cursos()).extracting(CursoDTO.Resumo::codigo).containsExactly("ADS");
        }

        @Test
        @DisplayName("Rejeita registro duplicado")
        void registroDuplicado() {
            when(professorRepository.existsByRegistro("P-100")).thenReturn(true);
            assertThatThrownBy(() -> service.criar(new ProfessorDTO.Request(
                    "João", "P-100", "BD", "joao", "Senha123", Set.of())))
                    .isInstanceOf(ConflitoException.class);
            verify(professorRepository, never()).save(any());
        }
    }

    @Nested
    @ExtendWith(MockitoExtension.class)
    class CadastroDeCurso {

        @Mock CursoRepository cursoRepository;
        @Mock TurmaRepository turmaRepository;
        @Mock AtividadeService atividades;
        @InjectMocks CursoService service;

        @Test
        @DisplayName("Cria a subclasse correta conforme a modalidade")
        void criaSubclassePorModalidade() {
            when(cursoRepository.existsByCodigo(any())).thenReturn(false);
            when(cursoRepository.save(any(Curso.class))).thenAnswer(inv -> inv.getArgument(0));

            CursoDTO.Response presencial = service.criar(new CursoDTO.Request(
                    "ads", "ADS", 2400, null, ModalidadeCurso.PRESENCIAL, "B-1", null));
            CursoDTO.Response ead = service.criar(new CursoDTO.Request(
                    "gti", "GTI", 1600, null, ModalidadeCurso.EAD, null, "Moodle"));

            ArgumentCaptor<Curso> captor = ArgumentCaptor.forClass(Curso.class);
            verify(cursoRepository, org.mockito.Mockito.times(2)).save(captor.capture());
            assertThat(captor.getAllValues().get(0)).isInstanceOf(CursoPresencial.class);
            assertThat(captor.getAllValues().get(1)).isInstanceOf(CursoEAD.class);
            assertThat(presencial.codigo()).isEqualTo("ADS");
            assertThat(presencial.sala()).isEqualTo("B-1");
            assertThat(ead.plataforma()).isEqualTo("Moodle");
            assertThat(ead.localAulas()).isEqualTo("Plataforma Moodle");
        }

        @Test
        @DisplayName("Rejeita código duplicado e curso EAD sem plataforma")
        void cadastrosInvalidos() {
            when(cursoRepository.existsByCodigo("ADS")).thenReturn(true);
            assertThatThrownBy(() -> service.criar(new CursoDTO.Request(
                    "ADS", "ADS", 100, null, ModalidadeCurso.PRESENCIAL, "B1", null)))
                    .isInstanceOf(ConflitoException.class);

            when(cursoRepository.existsByCodigo("EAD1")).thenReturn(false);
            assertThatThrownBy(() -> service.criar(new CursoDTO.Request(
                    "EAD1", "EAD", 100, null, ModalidadeCurso.EAD, null, null)))
                    .isInstanceOf(RegraNegocioException.class);
        }

        @Test
        @DisplayName("Não permite alterar a modalidade de um curso existente")
        void naoAlteraModalidade() {
            when(cursoRepository.findById(1L)).thenReturn(Optional.of(Fixtures.cursoPresencial()));
            assertThatThrownBy(() -> service.atualizar(1L, new CursoDTO.Request(
                    "ADS", "ADS", 100, null, ModalidadeCurso.EAD, null, "Moodle")))
                    .isInstanceOf(RegraNegocioException.class)
                    .hasMessageContaining("modalidade");
        }
    }
}
