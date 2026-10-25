package com.educonnect.repository;

import com.educonnect.model.Aluno;
import com.educonnect.model.Avaliacao;
import com.educonnect.model.Curso;
import com.educonnect.model.ModalidadeCurso;
import com.educonnect.model.Professor;
import com.educonnect.model.StatusCurso;
import com.educonnect.model.StatusTurma;
import com.educonnect.model.Turma;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

/**
 * Filtros dinâmicos com a Criteria API. Todos os valores são enviados como parâmetros
 * (sem concatenação de SQL), o que impede injeção de SQL.
 */
public final class Especificacoes {

    private Especificacoes() {
    }

    private static String padrao(String termo) {
        return "%" + termo.trim().toLowerCase()
                .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }

    private static boolean vazio(String termo) {
        return termo == null || termo.isBlank();
    }

    // ---------------------------------------------------------------- alunos

    public static Specification<Aluno> alunoPorTermo(String termo) {
        if (vazio(termo)) return null;
        String p = padrao(termo);
        return (root, q, cb) -> cb.or(
                cb.like(cb.lower(root.get("nome")), p, '\\'),
                cb.like(cb.lower(root.get("matricula")), p, '\\'));
    }

    public static Specification<Aluno> alunoAtivo(Boolean ativo) {
        return ativo == null ? null : (root, q, cb) -> cb.equal(root.get("ativo"), ativo);
    }

    public static Specification<Aluno> alunoDoCurso(Long cursoId) {
        return cursoId == null ? null : (root, q, cb) -> cb.equal(root.get("curso").get("id"), cursoId);
    }

    public static Specification<Aluno> alunoDaTurma(Long turmaId) {
        if (turmaId == null) return null;
        return (root, q, cb) -> {
            Join<Aluno, Turma> turmas = root.join("turmas");
            return cb.equal(turmas.get("id"), turmaId);
        };
    }

    // ---------------------------------------------------------------- professores

    public static Specification<Professor> professorPorTermo(String termo) {
        if (vazio(termo)) return null;
        String p = padrao(termo);
        return (root, q, cb) -> cb.or(
                cb.like(cb.lower(root.get("nome")), p, '\\'),
                cb.like(cb.lower(root.get("registro")), p, '\\'),
                cb.like(cb.lower(root.get("especialidade")), p, '\\'));
    }

    public static Specification<Professor> professorAtivo(Boolean ativo) {
        return ativo == null ? null : (root, q, cb) -> cb.equal(root.get("ativo"), ativo);
    }

    public static Specification<Professor> professorDoCurso(Long cursoId) {
        if (cursoId == null) return null;
        return (root, q, cb) -> {
            q.distinct(true);
            Join<Professor, Curso> cursos = root.join("cursos");
            return cb.equal(cursos.get("id"), cursoId);
        };
    }

    // ---------------------------------------------------------------- cursos

    public static Specification<Curso> cursoPorTermo(String termo) {
        if (vazio(termo)) return null;
        String p = padrao(termo);
        return (root, q, cb) -> cb.or(
                cb.like(cb.lower(root.get("nome")), p, '\\'),
                cb.like(cb.lower(root.get("codigo")), p, '\\'));
    }

    public static Specification<Curso> cursoComStatus(StatusCurso status) {
        return status == null ? null : (root, q, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Curso> cursoDaModalidade(ModalidadeCurso modalidade) {
        if (modalidade == null) return null;
        return (root, q, cb) -> cb.equal(root.type(),
                modalidade == ModalidadeCurso.EAD ? com.educonnect.model.CursoEAD.class
                        : com.educonnect.model.CursoPresencial.class);
    }

    // ---------------------------------------------------------------- turmas

    public static Specification<Turma> turmaPorTermo(String termo) {
        if (vazio(termo)) return null;
        String p = padrao(termo);
        return (root, q, cb) -> cb.or(
                cb.like(cb.lower(root.get("codigo")), p, '\\'),
                cb.like(cb.lower(root.get("curso").get("nome")), p, '\\'));
    }

    public static Specification<Turma> turmaDoCurso(Long cursoId) {
        return cursoId == null ? null : (root, q, cb) -> cb.equal(root.get("curso").get("id"), cursoId);
    }

    public static Specification<Turma> turmaDoProfessor(Long professorId) {
        return professorId == null ? null : (root, q, cb) -> cb.equal(root.get("professor").get("id"), professorId);
    }

    public static Specification<Turma> turmaComStatus(StatusTurma status) {
        return status == null ? null : (root, q, cb) -> cb.equal(root.get("status"), status);
    }

    // ---------------------------------------------------------------- avaliações

    public static Specification<Avaliacao> avaliacaoDaTurma(Long turmaId) {
        return turmaId == null ? null : (root, q, cb) -> cb.equal(root.get("turma").get("id"), turmaId);
    }

    public static Specification<Avaliacao> avaliacaoDoAluno(Long alunoId) {
        return alunoId == null ? null : (root, q, cb) -> cb.equal(root.get("aluno").get("id"), alunoId);
    }

    public static Specification<Avaliacao> avaliacaoDoCurso(Long cursoId) {
        return cursoId == null ? null : (root, q, cb) -> cb.equal(root.get("turma").get("curso").get("id"), cursoId);
    }

    public static Specification<Avaliacao> avaliacaoDoProfessor(Long professorId) {
        return professorId == null ? null
                : (root, q, cb) -> cb.equal(root.get("turma").get("professor").get("id"), professorId);
    }

    public static Specification<Avaliacao> avaliacaoNoPeriodo(LocalDate inicio, LocalDate fim) {
        if (inicio == null && fim == null) return null;
        return (root, q, cb) -> {
            if (inicio != null && fim != null) return cb.between(root.get("data"), inicio, fim);
            if (inicio != null) return cb.greaterThanOrEqualTo(root.get("data"), inicio);
            return cb.lessThanOrEqualTo(root.get("data"), fim);
        };
    }

    /** Combina especificações ignorando as nulas (filtros não informados). */
    @SafeVarargs
    public static <T> Specification<T> todas(Specification<T>... specs) {
        Specification<T> resultado = (root, q, cb) -> cb.conjunction();
        for (Specification<T> s : specs) {
            if (s != null) {
                resultado = resultado.and(s);
            }
        }
        return resultado;
    }
}
