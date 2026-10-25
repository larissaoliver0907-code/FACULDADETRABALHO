package com.educonnect.repository;

import com.educonnect.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AlunoRepository extends JpaRepository<Aluno, Long>, JpaSpecificationExecutor<Aluno> {

    boolean existsByMatricula(String matricula);

    boolean existsByMatriculaAndIdNot(String matricula, Long id);

    Optional<Aluno> findByLogin(String login);

    long countByAtivoTrue();

    /** Quantidade de alunos ativos por curso: [nome do curso, quantidade]. */
    @Query("""
            select c.nome, count(a) from Aluno a join a.curso c
            where a.ativo = true
            group by c.nome
            order by count(a) desc
            """)
    List<Object[]> contarAtivosPorCurso();
}
