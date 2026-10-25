package com.educonnect.model;

import com.educonnect.exception.RegraNegocioException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Turma de um curso, com professor responsável e lista de alunos matriculados.
 * Todas as regras de matrícula ficam nesta classe, de modo que nenhuma camada
 * consiga deixar a turma em estado inconsistente.
 */
@Entity
@Table(name = "turmas")
public class Turma implements Relatavel {

    private static final Pattern FORMATO_CODIGO = Pattern.compile("^[A-Z0-9][A-Z0-9-]{1,19}$");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "curso_id", nullable = false)
    private Curso curso;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "professor_id")
    private Professor professor;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "turma_alunos",
            joinColumns = @JoinColumn(name = "turma_id"),
            inverseJoinColumns = @JoinColumn(name = "aluno_id"))
    private Set<Aluno> alunos = new HashSet<>();

    @Column(name = "capacidade_maxima", nullable = false)
    private int capacidadeMaxima;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusTurma status = StatusTurma.ABERTA;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected Turma() {
    }

    public Turma(String codigo, Curso curso, int capacidadeMaxima) {
        alterarCodigo(codigo);
        associarCurso(curso);
        alterarCapacidade(capacidadeMaxima);
        this.criadoEm = LocalDateTime.now();
    }

    // ---------------------------------------------------------------- matrículas

    /**
     * Matricula o aluno na turma.
     *
     * @throws RegraNegocioException se a turma não estiver aberta, estiver lotada, o aluno
     *                               estiver inativo, pertencer a outro curso ou já estiver matriculado.
     */
    public void adicionarAluno(Aluno aluno) {
        if (aluno == null) {
            throw new RegraNegocioException("Informe o aluno a ser matriculado.");
        }
        if (status != StatusTurma.ABERTA) {
            throw new RegraNegocioException("A turma " + codigo + " não está aberta para matrículas.");
        }
        if (!aluno.isAtivo()) {
            throw new RegraNegocioException("O aluno " + aluno.getMatricula() + " está inativo.");
        }
        if (alunos.contains(aluno)) {
            throw new RegraNegocioException(
                    "O aluno " + aluno.getMatricula() + " já está matriculado na turma " + codigo + ".");
        }
        if (isLotada()) {
            throw new RegraNegocioException(
                    "A turma " + codigo + " está lotada (" + capacidadeMaxima + " vagas).");
        }
        if (!aluno.getCurso().equals(curso)) {
            throw new RegraNegocioException(
                    "O aluno pertence ao curso " + aluno.getCurso().getCodigo()
                            + " e a turma ao curso " + curso.getCodigo() + ".");
        }
        alunos.add(aluno);
        aluno.vincularTurma(this);
    }

    /** Remove a matrícula do aluno. As avaliações já lançadas continuam no histórico. */
    public void removerAluno(Aluno aluno) {
        if (aluno == null || !alunos.contains(aluno)) {
            throw new RegraNegocioException("O aluno não está matriculado nesta turma.");
        }
        alunos.remove(aluno);
        aluno.desvincularTurma(this);
    }

    public boolean possuiAluno(Aluno aluno) {
        return alunos.contains(aluno);
    }

    public int getQuantidadeMatriculados() {
        return alunos.size();
    }

    public int getVagasDisponiveis() {
        return Math.max(0, capacidadeMaxima - alunos.size());
    }

    public boolean isLotada() {
        return alunos.size() >= capacidadeMaxima;
    }

    // ---------------------------------------------------------------- associações

    public void associarCurso(Curso novoCurso) {
        if (novoCurso == null) {
            throw new RegraNegocioException("O curso da turma é obrigatório.");
        }
        if (!novoCurso.isAtivo()) {
            throw new RegraNegocioException("Não é possível associar a turma a um curso inativo.");
        }
        if (curso != null && !curso.equals(novoCurso) && !alunos.isEmpty()) {
            throw new RegraNegocioException("Não é possível trocar o curso de uma turma com alunos matriculados.");
        }
        if (professor != null && !professor.lecionaNoCurso(novoCurso)) {
            throw new RegraNegocioException("O professor responsável não leciona no novo curso.");
        }
        this.curso = novoCurso;
    }

    public void associarProfessor(Professor novoProfessor) {
        if (novoProfessor == null) {
            throw new RegraNegocioException("Informe o professor responsável.");
        }
        if (!novoProfessor.isAtivo()) {
            throw new RegraNegocioException("O professor " + novoProfessor.getRegistro() + " está inativo.");
        }
        if (!novoProfessor.lecionaNoCurso(curso)) {
            throw new RegraNegocioException(
                    "O professor " + novoProfessor.getNome() + " não está associado ao curso " + curso.getCodigo() + ".");
        }
        if (professor != null) {
            professor.desvincularTurma(this);
        }
        this.professor = novoProfessor;
        novoProfessor.vincularTurma(this);
    }

    public void removerProfessor() {
        if (professor != null) {
            professor.desvincularTurma(this);
            professor = null;
        }
    }

    // ---------------------------------------------------------------- dados e status

    public void alterarCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new RegraNegocioException("O código da turma é obrigatório.");
        }
        String normalizado = codigo.trim().toUpperCase();
        if (!FORMATO_CODIGO.matcher(normalizado).matches()) {
            throw new RegraNegocioException(
                    "Código da turma inválido: use de 2 a 20 letras maiúsculas, números ou hífen.");
        }
        this.codigo = normalizado;
    }

    public void alterarCapacidade(int novaCapacidade) {
        if (novaCapacidade <= 0) {
            throw new RegraNegocioException("A capacidade máxima deve ser maior que zero.");
        }
        if (novaCapacidade < alunos.size()) {
            throw new RegraNegocioException(
                    "A capacidade não pode ser menor que o número de alunos matriculados (" + alunos.size() + ").");
        }
        this.capacidadeMaxima = novaCapacidade;
    }

    public void alterarStatus(StatusTurma novoStatus) {
        if (novoStatus == null) {
            throw new RegraNegocioException("Informe o status da turma.");
        }
        this.status = novoStatus;
    }

    public boolean isAberta() {
        return status == StatusTurma.ABERTA;
    }

    /** Resumo textual da turma, usado na interface e em relatórios. */
    public String getResumo() {
        String nomeProfessor = professor == null ? "sem professor" : professor.getNome();
        return String.format("Turma %s — %s (%s) — %s — %d/%d alunos — %s",
                codigo, curso.getNome(), curso.getModalidade(), nomeProfessor,
                alunos.size(), capacidadeMaxima, status);
    }

    @Override
    public LinkedHashMap<String, Object> gerarRelatorio() {
        LinkedHashMap<String, Object> linha = new LinkedHashMap<>();
        linha.put("Código", codigo);
        linha.put("Curso", curso.getNome());
        linha.put("Professor", professor == null ? "—" : professor.getNome());
        linha.put("Matriculados", alunos.size());
        linha.put("Capacidade", capacidadeMaxima);
        linha.put("Ocupação (%)", Math.round(alunos.size() * 100.0 / capacidadeMaxima));
        linha.put("Status", status.name());
        return linha;
    }

    public Long getId() {
        return id;
    }

    public String getCodigo() {
        return codigo;
    }

    public Curso getCurso() {
        return curso;
    }

    public Professor getProfessor() {
        return professor;
    }

    public Set<Aluno> getAlunos() {
        return Collections.unmodifiableSet(alunos);
    }

    public int getCapacidadeMaxima() {
        return capacidadeMaxima;
    }

    public StatusTurma getStatus() {
        return status;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Turma outra)) return false;
        return id != null && id.equals(outra.getId());
    }

    @Override
    public int hashCode() {
        return Turma.class.hashCode();
    }
}
