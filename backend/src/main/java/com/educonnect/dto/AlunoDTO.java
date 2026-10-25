package com.educonnect.dto;

import com.educonnect.model.Aluno;
import com.educonnect.model.SituacaoAcademica;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class AlunoDTO {

    private AlunoDTO() {
    }

    /**
     * Cadastro e edição. Na edição, {@code senha} é opcional: quando vazia, a senha atual é mantida.
     */
    public record Request(
            @NotBlank(message = "Informe o nome.") @Size(max = 120, message = "Nome muito longo.") String nome,
            @NotBlank(message = "Informe a matrícula.")
            @Pattern(regexp = Validacoes.MATRICULA_REGEX, message = Validacoes.MATRICULA_MENSAGEM) String matricula,
            @NotNull(message = "Selecione o curso.") Long cursoId,
            @NotBlank(message = "Informe o login.")
            @Pattern(regexp = Validacoes.LOGIN_REGEX, message = Validacoes.LOGIN_MENSAGEM) String login,
            @Pattern(regexp = Validacoes.SENHA_REGEX, message = Validacoes.SENHA_MENSAGEM) String senha) {

        @Override
        public String toString() {
            return "AlunoDTO.Request[matricula=" + matricula + "]";
        }
    }

    public record Resumo(Long id, String nome, String matricula, boolean ativo) {
        public static Resumo de(Aluno a) {
            return new Resumo(a.getId(), a.getNome(), a.getMatricula(), a.isAtivo());
        }
    }

    public record Response(
            Long id,
            String nome,
            String matricula,
            String login,
            boolean ativo,
            CursoDTO.Resumo curso,
            List<TurmaDTO.Resumo> turmas,
            LocalDateTime criadoEm) {

        public static Response de(Aluno a, List<TurmaDTO.Resumo> turmas) {
            return new Response(a.getId(), a.getNome(), a.getMatricula(), a.getLogin(), a.isAtivo(),
                    CursoDTO.Resumo.de(a.getCurso()), turmas, a.getCriadoEm());
        }
    }

    public record DesempenhoTurma(
            TurmaDTO.Resumo turma,
            int quantidadeAvaliacoes,
            BigDecimal media,
            SituacaoAcademica situacao,
            String situacaoDescricao) {
    }

    public record Desempenho(
            Resumo aluno,
            BigDecimal mediaGeral,
            int totalAvaliacoes,
            boolean criterioConfigurado,
            List<DesempenhoTurma> turmas) {
    }
}
