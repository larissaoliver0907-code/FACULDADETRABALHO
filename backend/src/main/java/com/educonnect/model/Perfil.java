package com.educonnect.model;

/** Perfis de acesso do sistema. Cada perfil corresponde a uma subclasse de {@link Usuario}. */
public enum Perfil {
    ALUNO,
    PROFESSOR,
    ADMINISTRADOR;

    /** Nome da autoridade usada pelo Spring Security (ex.: ROLE_ADMINISTRADOR). */
    public String autoridade() {
        return "ROLE_" + name();
    }
}
