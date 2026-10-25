package com.educonnect.dto;

import com.educonnect.model.StatusTurma;
import com.educonnect.model.Turma;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.Comparator;
import java.util.List;

public final class TurmaDTO {

    private TurmaDTO() {
    }

    public record Request(
            @NotBlank(message = "Informe o código.")
            @Pattern(regexp = Validacoes.CODIGO_REGEX, message = Validacoes.CODIGO_MENSAGEM) String codigo,
            @NotNull(message = "Selecione o curso.") Long cursoId,
            Long professorId,
            @NotNull(message = "Informe a capacidade máxima.")
            @Min(value = 1, message = "A capacidade deve ser de pelo menos 1 aluno.")
            @Max(value = 1000, message = "Capacidade acima do permitido.") Integer capacidadeMaxima,
            StatusTurma status) {
    }

    public record MatriculaRequest(@NotNull(message = "Selecione o aluno.") Long alunoId) {
    }

    public record Resumo(Long id, String codigo, String cursoNome) {
        public static Resumo de(Turma t) {
            return new Resumo(t.getId(), t.getCodigo(), t.getCurso().getNome());
        }
    }

    public record Response(
            Long id,
            String codigo,
            CursoDTO.Resumo curso,
            ProfessorDTO.Resumo professor,
            int capacidadeMaxima,
            int matriculados,
            int vagasDisponiveis,
            StatusTurma status,
            String resumo,
            List<AlunoDTO.Resumo> alunos) {

        public static Response de(Turma t, boolean incluirAlunos) {
            List<AlunoDTO.Resumo> alunos = incluirAlunos
                    ? t.getAlunos().stream().map(AlunoDTO.Resumo::de)
                        .sorted(Comparator.comparing(AlunoDTO.Resumo::nome)).toList()
                    : null;
            return new Response(t.getId(), t.getCodigo(), CursoDTO.Resumo.de(t.getCurso()),
                    ProfessorDTO.Resumo.de(t.getProfessor()), t.getCapacidadeMaxima(),
                    t.getQuantidadeMatriculados(), t.getVagasDisponiveis(), t.getStatus(), t.getResumo(), alunos);
        }
    }
}
