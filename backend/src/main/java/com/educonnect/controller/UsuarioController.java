package com.educonnect.controller;

import com.educonnect.dto.PaginaResponse;
import com.educonnect.dto.UsuarioDTO;
import com.educonnect.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @GetMapping
    public PaginaResponse<UsuarioDTO.Response> listar(@RequestParam(required = false) String q,
                                                      @PageableDefault(sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.listar(q, pageable);
    }

    @PostMapping("/administradores")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioDTO.Response criarAdministrador(@Valid @RequestBody UsuarioDTO.AdministradorRequest request) {
        return service.criarAdministrador(request);
    }

    @PatchMapping("/{id}/ativo")
    public UsuarioDTO.Response alterarAtivo(@PathVariable Long id, @RequestParam boolean valor) {
        return service.alterarAtivo(id, valor);
    }

    @PutMapping("/{id}/senha")
    public ResponseEntity<Void> redefinirSenha(@PathVariable Long id,
                                               @Valid @RequestBody UsuarioDTO.RedefinirSenhaRequest request) {
        service.redefinirSenha(id, request);
        return ResponseEntity.noContent().build();
    }
}
