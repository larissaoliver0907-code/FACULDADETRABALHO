package com.educonnect.controller;

import com.educonnect.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Informa as contas de exemplo exibidas na tela de login (somente no perfil "demo").
 * Fora desse perfil o endpoint não existe.
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
            new Conta("professor", "Professor"),
            new Conta("aluno", "Aluno"));

    private final UsuarioRepository usuarios;
    private final String senhaDemo;

    public ContasExemploController(UsuarioRepository usuarios, @Value("${DEMO_PASSWORD:}") String senhaDemo) {
        this.usuarios = usuarios;
        this.senhaDemo = senhaDemo;
    }

    @GetMapping("/contas-exemplo")
    public ContasExemplo listar() {
        List<Conta> existentes = CONTAS.stream().filter(c -> usuarios.existsByLogin(c.login())).toList();
        return new ContasExemplo(senhaDemo, existentes);
    }
}
