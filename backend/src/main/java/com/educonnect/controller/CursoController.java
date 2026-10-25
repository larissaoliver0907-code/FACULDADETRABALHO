package com.educonnect.controller;

import com.educonnect.dto.CursoDTO;
import com.educonnect.dto.PaginaResponse;
import com.educonnect.dto.TurmaDTO;
import com.educonnect.model.ModalidadeCurso;
import com.educonnect.model.StatusCurso;
import com.educonnect.service.CursoService;
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
@RequestMapping("/api/cursos")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class CursoController {

    private final CursoService service;

    public CursoController(CursoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','PROFESSOR')")
    public PaginaResponse<CursoDTO.Response> listar(@RequestParam(required = false) String q,
                                                    @RequestParam(required = false) StatusCurso status,
                                                    @RequestParam(required = false) ModalidadeCurso modalidade,
                                                    @PageableDefault(sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.listar(q, status, modalidade, pageable);
    }

    /** Lista enxuta de cursos ativos para preencher campos de seleção. */
    @GetMapping("/ativos")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','PROFESSOR')")
    public List<CursoDTO.Resumo> ativos() {
        return service.listarAtivos();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','PROFESSOR')")
    public CursoDTO.Response buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @GetMapping("/{id}/turmas")
    public List<TurmaDTO.Response> turmas(@PathVariable Long id) {
        return service.turmasDoCurso(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CursoDTO.Response criar(@Valid @RequestBody CursoDTO.Request request) {
        return service.criar(request);
    }

    @PutMapping("/{id}")
    public CursoDTO.Response atualizar(@PathVariable Long id, @Valid @RequestBody CursoDTO.Request request) {
        return service.atualizar(id, request);
    }

    @PatchMapping("/{id}/status")
    public CursoDTO.Response alterarStatus(@PathVariable Long id, @RequestParam StatusCurso valor) {
        return service.alterarStatus(id, valor);
    }
}
