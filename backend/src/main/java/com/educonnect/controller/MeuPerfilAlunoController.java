package com.educonnect.controller;

import com.educonnect.dto.AlunoDTO;
import com.educonnect.dto.AvaliacaoDTO;
import com.educonnect.security.UsuarioAtual;
import com.educonnect.service.AlunoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Área do aluno: cada aluno consulta somente os próprios dados, sem informar ids na URL. */
@RestController
@RequestMapping("/api/me")
@PreAuthorize("hasRole('ALUNO')")
public class MeuPerfilAlunoController {

    private final AlunoService service;
    private final UsuarioAtual usuarioAtual;

    public MeuPerfilAlunoController(AlunoService service, UsuarioAtual usuarioAtual) {
        this.service = service;
        this.usuarioAtual = usuarioAtual;
    }

    @GetMapping
    public AlunoDTO.Response meusDados() {
        return service.buscar(usuarioAtual.obter().id());
    }

    @GetMapping("/avaliacoes")
    public List<AvaliacaoDTO.Response> minhasAvaliacoes() {
        return service.historico(usuarioAtual.obter().id());
    }

    @GetMapping("/desempenho")
    public AlunoDTO.Desempenho meuDesempenho() {
        return service.desempenho(usuarioAtual.obter().id());
    }
}
