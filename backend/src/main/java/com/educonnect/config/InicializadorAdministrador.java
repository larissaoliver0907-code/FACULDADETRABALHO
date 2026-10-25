package com.educonnect.config;

import com.educonnect.dto.Validacoes;
import com.educonnect.model.Administrador;
import com.educonnect.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cria o primeiro administrador quando o banco não possui usuários, usando as variáveis
 * ADMIN_LOGIN e ADMIN_PASSWORD. Nenhuma credencial fica fixa no código.
 */
@Component
@Order(1)
public class InicializadorAdministrador implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(InicializadorAdministrador.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String login;
    private final String senha;
    private final String nome;

    public InicializadorAdministrador(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                                      @Value("${educonnect.bootstrap.admin-login:}") String login,
                                      @Value("${educonnect.bootstrap.admin-password:}") String senha,
                                      @Value("${educonnect.bootstrap.admin-nome:Administrador}") String nome) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.login = login;
        this.senha = senha;
        this.nome = nome;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (usuarioRepository.count() > 0) {
            return;
        }
        if (login == null || login.isBlank() || senha == null || senha.isBlank()) {
            log.warn("Nenhum usuário cadastrado. Defina ADMIN_LOGIN e ADMIN_PASSWORD e reinicie para criar o primeiro administrador.");
            return;
        }
        if (!login.matches(Validacoes.LOGIN_REGEX) || !senha.matches(Validacoes.SENHA_REGEX)) {
            log.error("ADMIN_LOGIN ou ADMIN_PASSWORD fora do padrão exigido. {} {}",
                    Validacoes.LOGIN_MENSAGEM, Validacoes.SENHA_MENSAGEM);
            return;
        }
        usuarioRepository.save(new Administrador(nome, login, passwordEncoder.encode(senha)));
        log.info("Administrador inicial criado com o login informado em ADMIN_LOGIN.");
    }
}
