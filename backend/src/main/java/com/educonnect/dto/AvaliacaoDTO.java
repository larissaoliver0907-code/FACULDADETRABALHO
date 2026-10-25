package com.educonnect.dto;

import com.educonnect.model.Avaliacao;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class AvaliacaoDTO {

    private AvaliacaoDTO() {
    }

    public record Request(
            @NotNull(message = "Selecione o aluno.") Long alunoId,
            @NotNull(message = "Selecione a turma.") Long turmaId,
            @NotBlank(message = "Informe a descrição.") @Size(max = 200) String descricao,
            @NotNull(message = "Informe a nota.")
            @DecimalMin(value = "0.0", message = "A nota mínima é 0.")
            @DecimalMax(value = "10.0", message = "A nota máxima é 10.")
            @Digits(integer = 2, fraction = 2, message = "Use no máximo duas casas decimais.") BigDecimal nota,
            @NotNull(message = "Informe a data.")
            @PastOrPresent(message = "A data não pode estar no futuro.") LocalDate data) {
    }

    public record AtualizacaoRequest(
            @NotBlank(message = "Informe a descrição.") @Size(max = 200) String descricao,
            @NotNull(message = "Informe a nota.")
            @DecimalMin(value = "0.0", message = "A nota mínima é 0.")
            @DecimalMax(value = "10.0", message = "A nota máxima é 10.")
            @Digits(integer = 2, fraction = 2, message = "Use no máximo duas casas decimais.") BigDecimal nota,
            @NotNull(message = "Informe a data.")
            @PastOrPresent(message = "A data não pode estar no futuro.") LocalDate data) {
    }

    public record Response(
            Long id,
            AlunoDTO.Resumo aluno,
            TurmaDTO.Resumo turma,
            String descricao,
            BigDecimal nota,
            LocalDate data,
            LocalDateTime atualizadoEm) {

        public static Response de(Avaliacao a) {
            return new Response(a.getId(), AlunoDTO.Resumo.de(a.getAluno()), TurmaDTO.Resumo.de(a.getTurma()),
                    a.getDescricao(), a.getNota(), a.getData(), a.getAtualizadoEm());
        }
    }
}
