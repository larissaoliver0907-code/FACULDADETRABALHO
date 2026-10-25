package com.educonnect.repository;

import com.educonnect.model.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long>, JpaSpecificationExecutor<Avaliacao> {

    @Query("""
            select av from Avaliacao av join fetch av.turma t join fetch t.curso
            where av.aluno.id = :alunoId
            order by av.data desc, av.id desc
            """)
    List<Avaliacao> historicoDoAluno(@Param("alunoId") Long alunoId);

    @Query("select av.nota from Avaliacao av where av.aluno.id = :alunoId and av.turma.id = :turmaId")
    List<BigDecimal> notasDoAlunoNaTurma(@Param("alunoId") Long alunoId, @Param("turmaId") Long turmaId);

    @Query("select avg(av.nota) from Avaliacao av")
    Double mediaGeral();

    /** [aluno.id, turma.id, nota] de todas as avaliações, para cálculo de desempenho. */
    @Query("select av.aluno.id, av.turma.id, av.nota from Avaliacao av")
    List<Object[]> notasPorAlunoETurma();

    boolean existsByTurmaId(Long turmaId);
}
