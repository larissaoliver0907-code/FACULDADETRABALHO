package com.educonnect.model;

import com.educonnect.exception.RegraNegocioException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;

/** Professor da instituição, associado aos cursos em que leciona e às turmas sob sua responsabilidade. */
@Entity
@Table(name = "professores")
@PrimaryKeyJoinColumn(name = "id")
public class Professor extends Usuario {

    @Column(nullable = false, unique = true, length = 30)
    private String registro;

    @Column(nullable = false, length = 120)
    private String especialidade;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "professor_cursos",
            joinColumns = @JoinColumn(name = "professor_id"),
            inverseJoinColumns = @JoinColumn(name = "curso_id"))
    private Set<Curso> cursos = new HashSet<>();

    @OneToMany(mappedBy = "professor", fetch = FetchType.LAZY)
    private List<Turma> turmas = new ArrayList<>();

    protected Professor() {
    }

    public Professor(String nome, String login, String senhaHash, String registro, String especialidade) {
        super(nome, login, senhaHash, Perfil.PROFESSOR);
        alterarRegistro(registro);
        alterarEspecialidade(especialidade);
    }

    public void alterarRegistro(String registro) {
        if (registro == null || registro.isBlank()) {
            throw new RegraNegocioException("O registro do professor é obrigatório.");
        }
        this.registro = registro.trim().toUpperCase();
    }

    public void alterarEspecialidade(String especialidade) {
        if (especialidade == null || especialidade.isBlank()) {
            throw new RegraNegocioException("A especialidade é obrigatória.");
        }
        this.especialidade = especialidade.trim();
    }

    /** Substitui os cursos em que o professor leciona, aceitando apenas cursos ativos. */
    public void definirCursos(Set<Curso> novosCursos) {
        for (Curso curso : novosCursos) {
            if (!curso.isAtivo()) {
                throw new RegraNegocioException("O curso " + curso.getCodigo() + " está inativo.");
            }
        }
        cursos.clear();
        cursos.addAll(novosCursos);
    }

    public boolean lecionaNoCurso(Curso curso) {
        return cursos.contains(curso);
    }

    @Override
    public String getIdentificacao() {
        return registro;
    }

    @Override
    public LinkedHashMap<String, Object> gerarRelatorio() {
        LinkedHashMap<String, Object> linha = new LinkedHashMap<>();
        linha.put("Registro", registro);
        linha.put("Nome", getNome());
        linha.put("Especialidade", especialidade);
        linha.put("Cursos", cursos.size());
        linha.put("Turmas", turmas.size());
        linha.put("Situação", isAtivo() ? "Ativo" : "Inativo");
        return linha;
    }

    public String getRegistro() {
        return registro;
    }

    public String getEspecialidade() {
        return especialidade;
    }

    public Set<Curso> getCursos() {
        return Collections.unmodifiableSet(cursos);
    }

    public List<Turma> getTurmas() {
        return Collections.unmodifiableList(turmas);
    }

    void vincularTurma(Turma turma) {
        if (!turmas.contains(turma)) {
            turmas.add(turma);
        }
    }

    void desvincularTurma(Turma turma) {
        turmas.remove(turma);
    }
}
