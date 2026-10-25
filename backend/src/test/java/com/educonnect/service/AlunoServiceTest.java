package com.educonnect.service;

import com.educonnect.dto.AlunoDTO;
import com.educonnect.exception.ConflitoException;
import com.educonnect.exception.RecursoNaoEncontradoException;
import com.educonnect.exception.RegraNegocioException;
import com.educonnect.model.Aluno;
import com.educonnect.model.CursoPresencial;
import com.educonnect.model.Fixtures;
import com.educonnect.repository.AlunoRepository;
import com.educonnect.repository.AvaliacaoRepository;
import com.educonnect.repository.CursoRepository;
import com.educonnect.repository.TurmaRepository;
import com.educonnect.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AlunoServiceTest {

    @Mock AlunoRepository alunoRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock CursoRepository cursoRepository;
    @Mock TurmaRepository turmaRepository;
    @Mock AvaliacaoRepository avaliacaoRepository;
    @Mock DesempenhoService desempenhoService;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AtividadeService atividades;

    @InjectMocks AlunoService service;

    private final CursoPresencial curso = Fixtures.cursoPresencial();

    private AlunoDTO.Request request(String matricula, String senha) {
        return new AlunoDTO.Request("Maria Silva", matricula, 1L, "maria.silva", senha);
    }

    @Test
    @DisplayName("Cadastro válido: normaliza dados, grava hash da senha e registra atividade")
    void cadastroValido() {
        when(alunoRepository.existsByMatricula("A2026001")).thenReturn(false);
        when(usuarioRepository.existsByLogin("maria.silva")).thenReturn(false);
        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(passwordEncoder.encode("Senha123")).thenReturn("hash-bcrypt");
        when(alunoRepository.save(any(Aluno.class))).thenAnswer(inv -> inv.getArgument(0));

        AlunoDTO.Response resposta = service.criar(request("a2026001", "Senha123"));

        ArgumentCaptor<Aluno> captor = ArgumentCaptor.forClass(Aluno.class);
        verify(alunoRepository).save(captor.capture());
        Aluno salvo = captor.getValue();
        assertThat(salvo.getMatricula()).isEqualTo("A2026001");
        assertThat(salvo.getSenhaHash()).isEqualTo("hash-bcrypt").isNotEqualTo("Senha123");
        assertThat(salvo.getCurso()).isSameAs(curso);
        assertThat(resposta.nome()).isEqualTo("Maria Silva");
        verify(atividades).registrar(anyString(), anyString());
    }

    @Test
    @DisplayName("Cadastro inválido: matrícula duplicada")
    void matriculaDuplicada() {
        when(alunoRepository.existsByMatricula("A2026001")).thenReturn(true);

        assertThatThrownBy(() -> service.criar(request("A2026001", "Senha123")))
                .isInstanceOf(ConflitoException.class)
                .hasMessageContaining("matrícula");
        verify(alunoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cadastro inválido: login já usado por outro usuário")
    void loginDuplicado() {
        when(alunoRepository.existsByMatricula("A2026001")).thenReturn(false);
        when(usuarioRepository.existsByLogin("maria.silva")).thenReturn(true);

        assertThatThrownBy(() -> service.criar(request("A2026001", "Senha123")))
                .isInstanceOf(ConflitoException.class)
                .hasMessageContaining("login");
    }

    @Test
    @DisplayName("Cadastro inválido: senha inicial ausente")
    void semSenha() {
        assertThatThrownBy(() -> service.criar(request("A2026001", null)))
                .isInstanceOf(RegraNegocioException.class);
        verify(alunoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cadastro inválido: curso inexistente ou inativo")
    void cursoInvalido() {
        when(alunoRepository.existsByMatricula(anyString())).thenReturn(false);
        when(usuarioRepository.existsByLogin(anyString())).thenReturn(false);
        when(cursoRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.criar(request("A2026001", "Senha123")))
                .isInstanceOf(RecursoNaoEncontradoException.class);

        curso.inativar();
        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
        assertThatThrownBy(() -> service.criar(request("A2026001", "Senha123")))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("inativo");
    }

    @Test
    @DisplayName("Desativar preserva o cadastro e as matrículas")
    void desativarPreservaHistorico() {
        Aluno aluno = Fixtures.aluno("A001", curso);
        when(alunoRepository.findById(5L)).thenReturn(Optional.of(aluno));

        service.alterarAtivo(5L, false);

        assertThat(aluno.isAtivo()).isFalse();
        verify(alunoRepository, never()).delete(any());
    }
}
