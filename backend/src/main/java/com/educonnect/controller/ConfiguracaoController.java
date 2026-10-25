package com.educonnect.controller;

import com.educonnect.dto.ConfiguracaoDTO;
import com.educonnect.service.ConfiguracaoService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/configuracoes")
public class ConfiguracaoController {

    private final ConfiguracaoService service;

    public ConfiguracaoController(ConfiguracaoService service) {
        this.service = service;
    }

    @GetMapping
    public ConfiguracaoDTO.Response obter() {
        return ConfiguracaoDTO.Response.de(service.obter());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ConfiguracaoDTO.Response atualizar(@Valid @RequestBody ConfiguracaoDTO.Request request) {
        return service.atualizar(request);
    }
}
