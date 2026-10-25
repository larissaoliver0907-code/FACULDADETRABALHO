package com.educonnect.service;

import com.educonnect.model.Atividade;
import com.educonnect.repository.AtividadeRepository;
import com.educonnect.security.UsuarioAtual;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Registra eventos relevantes para o painel de atividades recentes (sem dados sensíveis). */
@Service
public class AtividadeService {

    private final AtividadeRepository repository;
    private final UsuarioAtual usuarioAtual;

    public AtividadeService(AtividadeRepository repository, UsuarioAtual usuarioAtual) {
        this.repository = repository;
        this.usuarioAtual = usuarioAtual;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void registrar(String tipo, String descricao) {
        repository.save(new Atividade(tipo, descricao, usuarioAtual.loginOuSistema()));
    }
}
