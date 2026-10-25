package com.educonnect.model;

import com.educonnect.exception.RegraNegocioException;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.util.LinkedHashMap;

/** Curso a distância, ministrado em uma plataforma virtual. */
@Entity
@DiscriminatorValue(ModalidadeCurso.VALOR_EAD)
public class CursoEAD extends Curso {

    @Column(length = 120)
    private String plataforma;

    protected CursoEAD() {
    }

    public CursoEAD(String codigo, String nome, int cargaHoraria, String descricao, String plataforma) {
        super(codigo, nome, cargaHoraria, descricao);
        alterarPlataforma(plataforma);
    }

    public void alterarPlataforma(String plataforma) {
        if (plataforma == null || plataforma.isBlank()) {
            throw new RegraNegocioException("Informe a plataforma virtual do curso EAD.");
        }
        this.plataforma = plataforma.trim();
    }

    @Override
    public ModalidadeCurso getModalidade() {
        return ModalidadeCurso.EAD;
    }

    @Override
    public String getLocalAulas() {
        return "Plataforma " + plataforma;
    }

    @Override
    public LinkedHashMap<String, Object> gerarRelatorio() {
        LinkedHashMap<String, Object> linha = super.gerarRelatorio();
        linha.put("Local das aulas", getLocalAulas());
        return linha;
    }

    public String getPlataforma() {
        return plataforma;
    }
}
