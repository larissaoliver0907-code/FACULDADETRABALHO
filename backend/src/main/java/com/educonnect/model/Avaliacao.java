package com.educonnect.model;

import com.educonnect.exception.RegraNegocioException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;

/**
 * Avaliação de um aluno em uma turma.
 * <p>
 * Encapsulamento: {@code nota} e {@code descricao} são privados e não possuem setter público.
 * A única forma de alterar a nota é {@link #atribuirNota(BigDecimal)}, que garante o intervalo de 0 a 10.
 */
@Entity
@Table(name = "avaliacoes")
public class Avaliacao implements Relatavel {

    public static final BigDecimal NOTA_MINIMA = BigDecimal.ZERO;
    public static final BigDecimal NOTA_MAXIMA = BigDecimal.TEN;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;

    @Column(nullable = false, length = 200)
    private String descricao;

    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal nota;

    @Column(name = "data_avaliacao", nullable = false)
    private LocalDate data;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected Avaliacao() {
    }

    /**
     * Cria a avaliação de um aluno matriculado na turma.
     *
     * @throws RegraNegocioException se o aluno não estiver matriculado ou a nota estiver fora de 0 a 10.
     */
    public Avaliacao(Aluno aluno, Turma turma, String descricao, BigDecimal nota, LocalDate data) {
        if (aluno == null || turma == null) {
            throw new RegraNegocioException("Aluno e turma são obrigatórios na avaliação.");
        }
        if (!turma.possuiAluno(aluno)) {
            throw new RegraNegocioException(
                    "O aluno " + aluno.getMatricula() + " não está matriculado na turma " + turma.getCodigo() + ".");
        }
        if (!turma.isAberta()) {
            throw new RegraNegocioException("A turma " + turma.getCodigo() + " não está aberta para novas avaliações.");
        }
        this.aluno = aluno;
        this.turma = turma;
        alterarDescricao(descricao);
        alterarData(data);
        atribuirNota(nota);
        this.criadoEm = LocalDateTime.now();
    }

    /**
     * Único ponto de alteração da nota. Aceita apenas valores entre 0 e 10 (inclusive),
     * com no máximo duas casas decimais.
     */
    public void atribuirNota(BigDecimal valor) {
        if (valor == null) {
            throw new RegraNegocioException("A nota é obrigatória.");
        }
        if (valor.compareTo(NOTA_MINIMA) < 0 || valor.compareTo(NOTA_MAXIMA) > 0) {
            throw new RegraNegocioException("A nota deve estar entre 0 e 10. Valor recebido: " + valor.toPlainString());
        }
        if (valor.stripTrailingZeros().scale() > 2) {
            throw new RegraNegocioException("A nota pode ter no máximo duas casas decimais.");
        }
        this.nota = valor.setScale(2, RoundingMode.UNNECESSARY);
        tocar();
    }

    /** Conveniência para valores numéricos simples (ex.: 7.5). */
    public void atribuirNota(double valor) {
        if (Double.isNaN(valor) || Double.isInfinite(valor)) {
            throw new RegraNegocioException("A nota deve ser um número válido.");
        }
        atribuirNota(BigDecimal.valueOf(valor));
    }

    public void alterarDescricao(String descricao) {
        if (descricao == null || descricao.isBlank()) {
            throw new RegraNegocioException("A descrição da avaliação é obrigatória.");
        }
        if (descricao.trim().length() > 200) {
            throw new RegraNegocioException("A descrição deve ter no máximo 200 caracteres.");
        }
        this.descricao = descricao.trim();
        tocar();
    }

    public void alterarData(LocalDate data) {
        if (data == null) {
            throw new RegraNegocioException("A data da avaliação é obrigatória.");
        }
        if (data.isAfter(LocalDate.now())) {
            throw new RegraNegocioException("A data da avaliação não pode estar no futuro.");
        }
        this.data = data;
        tocar();
    }

    private void tocar() {
        this.atualizadoEm = LocalDateTime.now();
    }

    @Override
    public LinkedHashMap<String, Object> gerarRelatorio() {
        LinkedHashMap<String, Object> linha = new LinkedHashMap<>();
        linha.put("Data", data);
        linha.put("Matrícula", aluno.getMatricula());
        linha.put("Aluno", aluno.getNome());
        linha.put("Turma", turma.getCodigo());
        linha.put("Avaliação", descricao);
        linha.put("Nota", nota);
        return linha;
    }

    public Long getId() {
        return id;
    }

    public Aluno getAluno() {
        return aluno;
    }

    public Turma getTurma() {
        return turma;
    }

    public String getDescricao() {
        return descricao;
    }

    public BigDecimal getNota() {
        return nota;
    }

    public LocalDate getData() {
        return data;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }
}
