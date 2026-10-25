package com.educonnect.security;

import com.educonnect.model.Perfil;

/** Principal armazenado no contexto de segurança após a validação do token. */
public record UsuarioAutenticado(Long id, String login, Perfil perfil) {

    public boolean isAdministrador() {
        return perfil == Perfil.ADMINISTRADOR;
    }

    public boolean isProfessor() {
        return perfil == Perfil.PROFESSOR;
    }

    public boolean isAluno() {
        return perfil == Perfil.ALUNO;
    }
}
