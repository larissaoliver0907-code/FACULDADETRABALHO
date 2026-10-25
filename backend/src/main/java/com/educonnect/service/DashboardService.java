package com.educonnect.service;

import com.educonnect.dto.DashboardDTO;
import com.educonnect.model.SituacaoAcademica;
import com.educonnect.model.StatusTurma;
import com.educonnect.repository.AlunoRepository;
import com.educonnect.repository.AtividadeRepository;
import com.educonnect.repository.AvaliacaoRepository;
import com.educonnect.repository.CursoRepository;
import com.educonnect.repository.ProfessorRepository;
import com.educonnect.repository.TurmaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Indicadores do painel, todos calculados a partir dos dados persistidos. */
@Service
public class DashboardService {

    /** Faixas de nota exibidas no gráfico de desempenho: [mínimo inclusive, máximo exclusivo). */
    private static final String[] ROTULOS_FAIXAS = {"0 a 2", "2 a 4", "4 a 6", "6 a 8", "8 a 10"};

    private final AlunoRepository alunoRepository;
    private final ProfessorRepository professorRepository;
    private final CursoRepository cursoRepository;
    private final TurmaRepository turmaRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final AtividadeRepository atividadeRepository;
    private final DesempenhoService desempenhoService;
    private final ConfiguracaoService configuracaoService;

    public DashboardService(AlunoRepository alunoRepository, ProfessorRepository professorRepository,
                            CursoRepository cursoRepository, TurmaRepository turmaRepository,
                            AvaliacaoRepository avaliacaoRepository, AtividadeRepository atividadeRepository,
                            DesempenhoService desempenhoService, ConfiguracaoService configuracaoService) {
        this.alunoRepository = alunoRepository;
        this.professorRepository = professorRepository;
        this.cursoRepository = cursoRepository;
        this.turmaRepository = turmaRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.atividadeRepository = atividadeRepository;
        this.desempenhoService = desempenhoService;
        this.configuracaoService = configuracaoService;
    }

    @Transactional
    public DashboardDTO.Response gerar() {
        Double media = avaliacaoRepository.mediaGeral();
        BigDecimal mediaGeral = media == null ? null : BigDecimal.valueOf(media).setScale(2, RoundingMode.HALF_UP);

        List<DashboardDTO.ItemSerie> alunosPorCurso = alunoRepository.contarAtivosPorCurso().stream()
                .map(l -> new DashboardDTO.ItemSerie((String) l[0], ((Number) l[1]).longValue()))
                .toList();

        List<Object[]> notas = avaliacaoRepository.notasPorAlunoETurma();
        long[] faixas = new long[ROTULOS_FAIXAS.length];
        for (Object[] linha : notas) {
            double nota = ((BigDecimal) linha[2]).doubleValue();
            int indice = Math.min((int) (nota / 2), faixas.length - 1);
            faixas[indice]++;
        }
        List<DashboardDTO.ItemSerie> distribuicao = new ArrayList<>();
        for (int i = 0; i < faixas.length; i++) {
            distribuicao.add(new DashboardDTO.ItemSerie(ROTULOS_FAIXAS[i], faixas[i]));
        }

        Map<SituacaoAcademica, Long> situacoes = desempenhoService.distribuicaoSituacoes(notas);
        List<DashboardDTO.ItemSerie> situacaoSerie = situacoes.entrySet().stream()
                .map(e -> new DashboardDTO.ItemSerie(e.getKey().getDescricao(), e.getValue()))
                .toList();

        return new DashboardDTO.Response(
                alunoRepository.countByAtivoTrue(),
                professorRepository.countByAtivoTrue(),
                cursoRepository.count(),
                turmaRepository.count(),
                mediaGeral,
                turmaRepository.contarMatriculas(StatusTurma.ABERTA),
                configuracaoService.obter().isCriterioConfigurado(),
                alunosPorCurso,
                distribuicao,
                situacaoSerie,
                atividadeRepository.findTop10ByOrderByCriadoEmDescIdDesc().stream()
                        .map(DashboardDTO.AtividadeResponse::de).toList());
    }
}
