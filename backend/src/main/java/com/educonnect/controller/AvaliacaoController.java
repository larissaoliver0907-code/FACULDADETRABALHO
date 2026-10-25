package com.educonnect.controller;

import com.educonnect.dto.AvaliacaoDTO;
import com.educonnect.dto.PaginaResponse;
import com.educonnect.service.AvaliacaoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/avaliacoes")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','PROFESSOR')")
public class AvaliacaoController {

    private final AvaliacaoService service;

    public AvaliacaoController(AvaliacaoService service) {
        this.service = service;
    }

    @GetMapping
    public PaginaResponse<AvaliacaoDTO.Response> listar(@RequestParam(required = false) Long turmaId,
                                                        @RequestParam(required = false) Long alunoId,
                                                        @RequestParam(required = false) Long cursoId,
                                                        @PageableDefault(sort = "data", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.listar(turmaId, alunoId, cursoId, pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AvaliacaoDTO.Response criar(@Valid @RequestBody AvaliacaoDTO.Request request) {
        return service.criar(request);
    }

    @PutMapping("/{id}")
    public AvaliacaoDTO.Response atualizar(@PathVariable Long id,
                                           @Valid @RequestBody AvaliacaoDTO.AtualizacaoRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
