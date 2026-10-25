package com.educonnect.model;

import com.educonnect.exception.RegraNegocioException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Set;
import java.util.regex.Pattern;

/** Aluno da instituição. A desativação preserva todo o histórico acadêmico. */
@Entity
@Table(name = "alunos")
@PrimaryKeyJoinColumn(name = "id")
public class Aluno extends Usuario {

    /** Matrícula: de 4 a 20 caracteres alfanuméricos (letras maiúsculas e números). */
    public static final Pattern FORMATO_MATRICULA = Pattern.compile("^[A-Z0-9]{4,20}$");

    @Column(nullable = false, unique = true, length = 20)
    private String matricula;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "curso_id", nullable = false)
    private Curso curso;

    /** Lado inverso da associação; a turma é a dona da lista de matriculados. */
    @ManyToMany(mappedBy = "alunos", fetch = FetchType.LAZY)
    private Set<Turma> turmas = new HashSet<>();

    protected Aluno() {
    }

    public Aluno(String nome, String login, String senhaHash, String matricula, Curso curso) {
        super(nome, login, senhaHash, Perfil.ALUNO);
        alterarMatricula(matricula);
        alterarCurso(curso);
    }

    public void alterarMatricula(String matricula) {
        if (matricula == null || matricula.isBlank()) {
            throw new RegraNegocioException("A matrícula é obrigatória.");
        }
        String normalizada = matricula.trim().toUpperCase();
        if (!FORMATO_MATRICULA.matcher(normalizada).matches()) {
            throw new RegraNegocioException(
                    "Matrícula inválida: use de 4 a 20 letras ou números, sem espaços ou símbolos.");
        }
        this.matricula = normalizada;
    }

    public void alterarCurso(Curso curso) {
        if (curso == null) {
            throw new RegraNegocioException("O curso do aluno é obrigatório.");
        }
        if (!curso.isAtivo()) {
            throw new RegraNegocioException("Não é possível vincular o aluno a um curso inativo.");
        }
        this.curso = curso;
    }

    @Override
    public String getIdentificacao() {
        return matricula;
    }

    @Override
    public LinkedHashMap<String, Object> gerarRelatorio() {
        LinkedHashMap<String, Object> linha = new LinkedHashMap<>();
        linha.put("Matrícula", matricula);
        linha.put("Nome", getNome());
        linha.put("Curso", curso.getNome());
        linha.put("Turmas", turmas.size());
        linha.put("Situação", isAtivo() ? "Ativo" : "Inativo");
        return linha;
    }

    public String getMatricula() {
        return matricula;
    }

    public Curso getCurso() {
        return curso;
    }

    public Set<Turma> getTurmas() {
        return Collections.unmodifiableSet(turmas);
    }

    /** Usado apenas por {@link Turma} para manter os dois lados da associação consistentes. */
    void vincularTurma(Turma turma) {
        turmas.add(turma);
    }

    void desvincularTurma(Turma turma) {
        turmas.remove(turma);
    }
}
