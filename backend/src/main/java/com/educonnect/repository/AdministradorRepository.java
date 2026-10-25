package com.educonnect.repository;

import com.educonnect.model.Administrador;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdministradorRepository extends JpaRepository<Administrador, Long> {

    long countByAtivoTrue();
}
