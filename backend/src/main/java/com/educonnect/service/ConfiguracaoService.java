package com.educonnect.service;

import com.educonnect.dto.ConfiguracaoDTO;
import com.educonnect.model.ConfiguracaoAcademica;
import com.educonnect.repository.ConfiguracaoAcademicaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfiguracaoService {

    private final ConfiguracaoAcademicaRepository repository;
    private final AtividadeService atividades;

    public ConfiguracaoService(ConfiguracaoAcademicaRepository repository, AtividadeService atividades) {
        this.repository = repository;
        this.atividades = atividades;
    }

    /** Devolve a configuração única, criando-a sem critérios definidos caso ainda não exista. */
    @Transactional
    public ConfiguracaoAcademica obter() {
        return repository.findById(ConfiguracaoAcademica.ID_UNICO)
                .orElseGet(() -> repository.save(new ConfiguracaoAcademica()));
    }

    @Transactional
    public ConfiguracaoDTO.Response atualizar(ConfiguracaoDTO.Request request) {
        ConfiguracaoAcademica config = obter();
        config.atualizar(request.mediaMinimaAprovacao(), request.mediaMinimaRecuperacao(),
                request.quantidadeMinimaAvaliacoes());
        atividades.registrar("CONFIGURACAO", "Critérios acadêmicos atualizados");
        return ConfiguracaoDTO.Response.de(config);
    }
}
