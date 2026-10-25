package com.educonnect.controller;

import com.educonnect.dto.AuthDTO;
import com.educonnect.security.UsuarioAtual;
import com.educonnect.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;
    private final UsuarioAtual usuarioAtual;

    public AuthController(AuthService authService, UsuarioAtual usuarioAtual) {
        this.authService = authService;
        this.usuarioAtual = usuarioAtual;
    }

    @PostMapping("/auth/login")
    public AuthDTO.LoginResponse login(@Valid @RequestBody AuthDTO.LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/auth/me")
    public AuthDTO.UsuarioLogado me() {
        return authService.usuarioLogado(usuarioAtual.obter().id());
    }

    @PostMapping("/auth/senha")
    public ResponseEntity<Void> alterarSenha(@Valid @RequestBody AuthDTO.AlterarSenhaRequest request) {
        authService.alterarPropriaSenha(usuarioAtual.obter().id(), request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
