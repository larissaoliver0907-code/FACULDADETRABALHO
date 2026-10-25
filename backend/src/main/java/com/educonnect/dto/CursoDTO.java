package com.educonnect.dto;

import com.educonnect.model.Curso;
import com.educonnect.model.CursoEAD;
import com.educonnect.model.CursoPresencial;
import com.educonnect.model.ModalidadeCurso;
import com.educonnect.model.StatusCurso;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.Hibernate;

import java.time.LocalDateTime;

public final class CursoDTO {

    private CursoDTO() {
    }

    public record Request(
            @NotBlank(message = "Informe o código.")
            @Pattern(regexp = Validacoes.CODIGO_REGEX, message = Validacoes.CODIGO_MENSAGEM) String codigo,
            @NotBlank(message = "Informe o nome.") @Size(max = 120) String nome,
            @NotNull(message = "Informe a carga horária.")
            @Min(value = 1, message = "A carga horária deve ser maior que zero.")
            @Max(value = 20000, message = "Carga horária acima do permitido.") Integer cargaHoraria,
            @Size(max = 1000, message = "A descrição deve ter no máximo 1000 caracteres.") String descricao,
            @NotNull(message = "Informe a modalidade.") ModalidadeCurso modalidade,
            @Size(max = 60) String sala,
            @Size(max = 120) String plataforma) {
    }

    public record Resumo(Long id, String codigo, String nome, ModalidadeCurso modalidade) {
        public static Resumo de(Curso c) {
            return new Resumo(c.getId(), c.getCodigo(), c.getNome(), c.getModalidade());
        }
    }

    public record Response(
            Long id,
            String codigo,
            String nome,
            int cargaHoraria,
            String descricao,
            StatusCurso status,
            ModalidadeCurso modalidade,
            String sala,
            String plataforma,
            String localAulas,
            Long quantidadeTurmas,
            LocalDateTime criadoEm) {

        public static Response de(Curso curso, Long quantidadeTurmas) {
            // Desfaz o proxy do Hibernate para acessar os dados específicos da subclasse.
            Curso c = (Curso) Hibernate.unproxy(curso);
            String sala = c instanceof CursoPresencial p ? p.getSala() : null;
            String plataforma = c instanceof CursoEAD e ? e.getPlataforma() : null;
            return new Response(c.getId(), c.getCodigo(), c.getNome(), c.getCargaHoraria(), c.getDescricao(),
                    c.getStatus(), c.getModalidade(), sala, plataforma, c.getLocalAulas(), quantidadeTurmas,
                    c.getCriadoEm());
        }
    }
}
