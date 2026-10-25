package com.educonnect.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/** Registro de atividade exibido no dashboard. Nunca contém senhas, tokens ou notas individuais. */
@Entity
@Table(name = "atividades")
public class Atividade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String tipo;

    @Column(nullable = false, length = 255)
    private String descricao;

    @Column(length = 60)
    private String usuario;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected Atividade() {
    }

    public Atividade(String tipo, String descricao, String usuario) {
        this.tipo = tipo;
        this.descricao = descricao.length() > 255 ? descricao.substring(0, 255) : descricao;
        this.usuario = usuario;
        this.criadoEm = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getTipo() {
        return tipo;
    }

    public String getDescricao() {
        return descricao;
    }

    public String getUsuario() {
        return usuario;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}
