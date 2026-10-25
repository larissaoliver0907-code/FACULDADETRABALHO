package com.educonnect.service.relatorio;

import com.educonnect.dto.RelatorioDTO;
import com.educonnect.model.Avaliacao;
import com.educonnect.model.ConfiguracaoAcademica;
import com.educonnect.repository.AvaliacaoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static com.educonnect.repository.Especificacoes.avaliacaoDaTurma;
import static com.educonnect.repository.Especificacoes.avaliacaoDoCurso;
import static com.educonnect.repository.Especificacoes.avaliacaoNoPeriodo;
import static com.educonnect.repository.Especificacoes.todas;

@Component
public class RelatorioNotas extends RelatorioBase<Avaliacao> {

    private final AvaliacaoRepository repository;

    public RelatorioNotas(AvaliacaoRepository repository) {
        this.repository = repository;
    }

    @Override
    public String getTipo() {
        return "notas";
    }

    @Override
    public String getTitulo() {
        return "Notas e médias";
    }

    @Override
    public String getDescricao() {
        return "Avaliações lançadas, com filtros por curso, turma e período.";
    }

    @Override
    protected List<Avaliacao> buscar(RelatorioDTO.Filtro f) {
        return repository.findAll(todas(avaliacaoDoCurso(f.cursoId()), avaliacaoDaTurma(f.turmaId()),
                avaliacaoNoPeriodo(f.inicio(), f.fim())), Sort.by(Sort.Direction.DESC, "data").and(Sort.by("id")));
    }

    @Override
    protected List<String> colunas() {
        return List.of("Data", "Matrícula", "Aluno", "Turma", "Avaliação", "Nota");
    }

    @Override
    protected Map<String, Object> resumo(List<Avaliacao> avaliacoes) {
        Map<String, Object> resumo = super.resumo(avaliacoes);
        List<BigDecimal> notas = avaliacoes.stream().map(Avaliacao::getNota).toList();
        resumo.put("Média", ConfiguracaoAcademica.calcularMedia(notas));
        resumo.put("Maior nota", notas.stream().max(BigDecimal::compareTo).orElse(null));
        resumo.put("Menor nota", notas.stream().min(BigDecimal::compareTo).orElse(null));
        return resumo;
    }
}
