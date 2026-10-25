package com.educonnect.didatico;

import com.educonnect.model.Usuario;
import com.educonnect.security.Autenticacao;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * VERSÃO DIDÁTICA de {@link Autenticacao} sobre uma lista em memória.
 * Mesmo na versão didática a senha é comparada com o hash, nunca em texto puro.
 */
public class AutenticacaoEmMemoria implements Autenticacao {

    private final RepositorioEmMemoria<Usuario> usuarios;
    private final PasswordEncoder encoder;

    public AutenticacaoEmMemoria(RepositorioEmMemoria<Usuario> usuarios, PasswordEncoder encoder) {
        this.usuarios = usuarios;
        this.encoder = encoder;
    }

    @Override
    public Usuario autenticar(String login, String senha) {
        String alvo = login == null ? "" : login.trim().toLowerCase();
        return usuarios.buscarPrimeiro(u -> u.getLogin().equals(alvo))
                .filter(Usuario::isAtivo)
                .filter(u -> senha != null && encoder.matches(senha, u.getSenhaHash()))
                .orElseThrow(() -> new BadCredentialsException("Login ou senha inválidos."));
    }
}
