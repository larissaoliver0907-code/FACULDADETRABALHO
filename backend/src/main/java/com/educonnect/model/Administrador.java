package com.educonnect.model;

import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

import java.util.LinkedHashMap;

/** Usuário com permissão para gerenciar cadastros e configurações. */
@Entity
@Table(name = "administradores")
@PrimaryKeyJoinColumn(name = "id")
public class Administrador extends Usuario {

    protected Administrador() {
    }

    public Administrador(String nome, String login, String senhaHash) {
        super(nome, login, senhaHash, Perfil.ADMINISTRADOR);
    }

    @Override
    public String getIdentificacao() {
        return getLogin();
    }

    @Override
    public LinkedHashMap<String, Object> gerarRelatorio() {
        LinkedHashMap<String, Object> linha = new LinkedHashMap<>();
        linha.put("Nome", getNome());
        linha.put("Login", getLogin());
        linha.put("Perfil", "Administrador");
        linha.put("Situação", isAtivo() ? "Ativo" : "Inativo");
        return linha;
    }
}
