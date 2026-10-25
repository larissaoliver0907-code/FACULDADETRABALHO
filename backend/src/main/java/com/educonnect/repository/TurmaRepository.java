package com.educonnect.repository;

import com.educonnect.model.StatusTurma;
import com.educonnect.model.Turma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TurmaRepository extends JpaRepository<Turma, Long>, JpaSpecificationExecutor<Turma> {

    boolean existsByCodigo(String codigo);

    boolean existsByCodigoAndIdNot(String codigo, Long id);

    List<Turma> findByCursoIdOrderByCodigoAsc(Long cursoId);

    List<Turma> findByProfessorIdOrderByCodigoAsc(Long professorId);

    long countByCursoId(Long cursoId);

    /** Matrículas em turmas com o status informado (ex.: ABERTA = matrículas ativas). */
    @Query("select count(a) from Turma t join t.alunos a where t.status = :status")
    long contarMatriculas(@Param("status") StatusTurma status);

    @Query("select t from Turma t join t.alunos a where a.id = :alunoId order by t.codigo")
    List<Turma> findByAlunoId(@Param("alunoId") Long alunoId);
}
