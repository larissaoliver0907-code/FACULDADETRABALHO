package com.educonnect.repository;

import com.educonnect.model.Professor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface ProfessorRepository extends JpaRepository<Professor, Long>, JpaSpecificationExecutor<Professor> {

    boolean existsByRegistro(String registro);

    boolean existsByRegistroAndIdNot(String registro, Long id);

    Optional<Professor> findByLogin(String login);

    long countByAtivoTrue();
}
