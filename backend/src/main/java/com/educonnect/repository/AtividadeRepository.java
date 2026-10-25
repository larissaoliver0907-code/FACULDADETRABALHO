package com.educonnect.repository;

import com.educonnect.model.Atividade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AtividadeRepository extends JpaRepository<Atividade, Long> {

    List<Atividade> findTop10ByOrderByCriadoEmDescIdDesc();
}
