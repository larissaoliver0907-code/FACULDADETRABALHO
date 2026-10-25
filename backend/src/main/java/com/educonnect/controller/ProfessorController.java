package com.educonnect.controller;

import com.educonnect.dto.PaginaResponse;
import com.educonnect.dto.ProfessorDTO;
import com.educonnect.dto.TurmaDTO;
import com.educonnect.service.ProfessorService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
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

import java.util.List;

@RestController
@RequestMapping("/api/professores")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class ProfessorController {

    private final ProfessorService service;

    public ProfessorController(ProfessorService service) {
        this.service = service;
    }

    @GetMapping
    public PaginaResponse<ProfessorDTO.Response> listar(@RequestParam(required = false) String q,
                                                        @RequestParam(required = false) Boolean ativo,
                                                        @RequestParam(required = false) Long cursoId,
                                                        @PageableDefault(sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.listar(q, ativo, cursoId, pageable);
    }

    @GetMapping("/{id}")
    public ProfessorDTO.Response buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    /** O próprio professor também pode consultar as turmas vinculadas a ele. */
    @GetMapping("/{id}/turmas")
    @PreAuthorize("hasRole('ADMINISTRADOR') or (hasRole('PROFESSOR') and #id == principal.id())")
    public List<TurmaDTO.Response> turmas(@PathVariable Long id) {
        return service.turmasDoProfessor(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProfessorDTO.Response criar(@Valid @RequestBody ProfessorDTO.Request request) {
        return service.criar(request);
    }

    @PutMapping("/{id}")
    public ProfessorDTO.Response atualizar(@PathVariable Long id, @Valid @RequestBody ProfessorDTO.Request request) {
        return service.atualizar(id, request);
    }

    @PatchMapping("/{id}/ativo")
    public ProfessorDTO.Response alterarAtivo(@PathVariable Long id, @RequestParam boolean valor) {
        return service.alterarAtivo(id, valor);
    }
}
