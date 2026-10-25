package com.educonnect.model;

import com.educonnect.exception.RegraNegocioException;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.util.LinkedHashMap;

/** Curso com aulas em sala física. */
@Entity
@DiscriminatorValue(ModalidadeCurso.VALOR_PRESENCIAL)
public class CursoPresencial extends Curso {

    @Column(length = 60)
    private String sala;

    protected CursoPresencial() {
    }

    public CursoPresencial(String codigo, String nome, int cargaHoraria, String descricao, String sala) {
        super(codigo, nome, cargaHoraria, descricao);
        alterarSala(sala);
    }

    public void alterarSala(String sala) {
        if (sala == null || sala.isBlank()) {
            throw new RegraNegocioException("Informe a sala de aula do curso presencial.");
        }
        this.sala = sala.trim();
    }

    @Override
    public ModalidadeCurso getModalidade() {
        return ModalidadeCurso.PRESENCIAL;
    }

    @Override
    public String getLocalAulas() {
        return "Sala " + sala;
    }

    @Override
    public LinkedHashMap<String, Object> gerarRelatorio() {
        LinkedHashMap<String, Object> linha = super.gerarRelatorio();
        linha.put("Local das aulas", getLocalAulas());
        return linha;
    }

    public String getSala() {
        return sala;
    }
}
