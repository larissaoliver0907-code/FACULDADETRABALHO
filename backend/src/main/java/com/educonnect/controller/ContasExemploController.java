package com.educonnect.controller;

import com.educonnect.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Informa as contas de exemplo exibidas na tela de login (somente no perfil "demo").
 * Só lista as contas que existem e cuja senha é DEMO_PASSWORD; fora desse perfil o endpoint não existe.
 */
@RestController
@RequestMapping("/api/auth")
@ConditionalOnProperty(name = "educonnect.demo.enabled", havingValue = "true")
public class ContasExemploController {

    public record Conta(String login, String perfil) {
    }

    public record ContasExemplo(String senha, List<Conta> contas) {
    }

    private static final List<Conta> CONTAS = List.of(
            new Conta("admin", "Administrador"),
            new Conta("ana.lima", "Professora"),
            new Conta("carla.souza", "Aluna"));

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final String senhaDemo;

    public ContasExemploController(UsuarioRepository usuarios, PasswordEncoder encoder,
                                   @Value("${DEMO_PASSWORD:}") String senhaDemo) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.senhaDemo = senhaDemo;
    }

    @GetMapping("/contas-exemplo")
    public ContasExemplo listar() {
        if (senhaDemo == null || senhaDemo.isBlank()) {
            return new ContasExemplo("", List.of());
        }
        List<Conta> validas = CONTAS.stream()
                .filter(c -> usuarios.findByLogin(c.login())
                        .filter(u -> u.isAtivo() && encoder.matches(senhaDemo, u.getSenhaHash()))
                        .isPresent())
                .toList();
        return new ContasExemplo(senhaDemo, validas);
    }
}
