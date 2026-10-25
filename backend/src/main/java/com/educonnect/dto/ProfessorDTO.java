package com.educonnect.dto;

import com.educonnect.model.Professor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

public final class ProfessorDTO {

    private ProfessorDTO() {
    }

    public record Request(
            @NotBlank(message = "Informe o nome.") @Size(max = 120) String nome,
            @NotBlank(message = "Informe o registro.") @Size(max = 30, message = "Registro muito longo.") String registro,
            @NotBlank(message = "Informe a especialidade.") @Size(max = 120) String especialidade,
            @NotBlank(message = "Informe o login.")
            @Pattern(regexp = Validacoes.LOGIN_REGEX, message = Validacoes.LOGIN_MENSAGEM) String login,
            @Pattern(regexp = Validacoes.SENHA_REGEX, message = Validacoes.SENHA_MENSAGEM) String senha,
            Set<Long> cursoIds) {

        @Override
        public String toString() {
            return "ProfessorDTO.Request[registro=" + registro + "]";
        }
    }

    public record Resumo(Long id, String nome, String registro) {
        public static Resumo de(Professor p) {
            return p == null ? null : new Resumo(p.getId(), p.getNome(), p.getRegistro());
        }
    }

    public record Response(
            Long id,
            String nome,
            String registro,
            String especialidade,
            String login,
            boolean ativo,
            List<CursoDTO.Resumo> cursos,
            int quantidadeTurmas,
            LocalDateTime criadoEm) {

        public static Response de(Professor p) {
            List<CursoDTO.Resumo> cursos = p.getCursos().stream()
                    .map(CursoDTO.Resumo::de)
                    .sorted(Comparator.comparing(CursoDTO.Resumo::nome))
                    .toList();
            return new Response(p.getId(), p.getNome(), p.getRegistro(), p.getEspecialidade(), p.getLogin(),
                    p.isAtivo(), cursos, p.getTurmas().size(), p.getCriadoEm());
        }
    }
}
