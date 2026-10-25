package com.educonnect.repository;

import com.educonnect.model.Curso;
import com.educonnect.model.StatusCurso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface CursoRepository extends JpaRepository<Curso, Long>, JpaSpecificationExecutor<Curso> {

    boolean existsByCodigo(String codigo);

    boolean existsByCodigoAndIdNot(String codigo, Long id);

    List<Curso> findByStatusOrderByNomeAsc(StatusCurso status);
}
