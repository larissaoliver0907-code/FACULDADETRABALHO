package com.educonnect.security;

import com.educonnect.exception.AcessoNegadoException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/** Acesso ao usuário autenticado na requisição atual. */
@Component
public class UsuarioAtual {

    public Optional<UsuarioAutenticado> opcional() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UsuarioAutenticado u) {
            return Optional.of(u);
        }
        return Optional.empty();
    }

    public UsuarioAutenticado obter() {
        return opcional().orElseThrow(() -> new AcessoNegadoException("Usuário não autenticado."));
    }

    /** Login para registros de atividade; "sistema" quando não há usuário na requisição. */
    public String loginOuSistema() {
        return opcional().map(UsuarioAutenticado::login).orElse("sistema");
    }
}
