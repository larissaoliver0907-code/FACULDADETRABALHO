package com.educonnect.controller;

import com.educonnect.dto.AlunoDTO;
import com.educonnect.dto.AvaliacaoDTO;
import com.educonnect.dto.PaginaResponse;
import com.educonnect.service.AlunoService;
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
@RequestMapping("/api/alunos")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AlunoController {

    private final AlunoService service;

    public AlunoController(AlunoService service) {
        this.service = service;
    }

    @GetMapping
    public PaginaResponse<AlunoDTO.Response> listar(@RequestParam(required = false) String q,
                                                    @RequestParam(required = false) Long cursoId,
                                                    @RequestParam(required = false) Long turmaId,
                                                    @RequestParam(required = false) Boolean ativo,
                                                    @PageableDefault(sort = "nome", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.listar(q, cursoId, turmaId, ativo, pageable);
    }

    @GetMapping("/{id}")
    public AlunoDTO.Response buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AlunoDTO.Response criar(@Valid @RequestBody AlunoDTO.Request request) {
        return service.criar(request);
    }

    @PutMapping("/{id}")
    public AlunoDTO.Response atualizar(@PathVariable Long id, @Valid @RequestBody AlunoDTO.Request request) {
        return service.atualizar(id, request);
    }

    @PatchMapping("/{id}/ativo")
    public AlunoDTO.Response alterarAtivo(@PathVariable Long id, @RequestParam boolean valor) {
        return service.alterarAtivo(id, valor);
    }

    @GetMapping("/{id}/avaliacoes")
    public List<AvaliacaoDTO.Response> historico(@PathVariable Long id) {
        return service.historico(id);
    }

    @GetMapping("/{id}/desempenho")
    public AlunoDTO.Desempenho desempenho(@PathVariable Long id) {
        return service.desempenho(id);
    }
}
