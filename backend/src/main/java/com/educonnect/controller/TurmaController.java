package com.educonnect.controller;

import com.educonnect.dto.PaginaResponse;
import com.educonnect.dto.TurmaDTO;
import com.educonnect.model.StatusTurma;
import com.educonnect.service.TurmaService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/turmas")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class TurmaController {

    private final TurmaService service;

    public TurmaController(TurmaService service) {
        this.service = service;
    }

    /** Professores recebem apenas as próprias turmas (filtro aplicado no serviço). */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','PROFESSOR')")
    public PaginaResponse<TurmaDTO.Response> listar(@RequestParam(required = false) String q,
                                                    @RequestParam(required = false) Long cursoId,
                                                    @RequestParam(required = false) Long professorId,
                                                    @RequestParam(required = false) StatusTurma status,
                                                    @PageableDefault(sort = "codigo", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.listar(q, cursoId, professorId, status, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','PROFESSOR')")
    public TurmaDTO.Response buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TurmaDTO.Response criar(@Valid @RequestBody TurmaDTO.Request request) {
        return service.criar(request);
    }

    @PutMapping("/{id}")
    public TurmaDTO.Response atualizar(@PathVariable Long id, @Valid @RequestBody TurmaDTO.Request request) {
        return service.atualizar(id, request);
    }

    @PostMapping("/{id}/alunos")
    public TurmaDTO.Response matricular(@PathVariable Long id, @Valid @RequestBody TurmaDTO.MatriculaRequest request) {
        return service.matricular(id, request.alunoId());
    }

    @DeleteMapping("/{id}/alunos/{alunoId}")
    public TurmaDTO.Response desmatricular(@PathVariable Long id, @PathVariable Long alunoId) {
        return service.desmatricular(id, alunoId);
    }
}
