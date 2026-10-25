package com.educonnect.service.relatorio;

import com.educonnect.dto.RelatorioDTO;
import com.educonnect.model.Turma;
import com.educonnect.repository.TurmaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

import static com.educonnect.repository.Especificacoes.todas;
import static com.educonnect.repository.Especificacoes.turmaDoCurso;

@Component
public class RelatorioTurmas extends RelatorioBase<Turma> {

    private final TurmaRepository repository;

    public RelatorioTurmas(TurmaRepository repository) {
        this.repository = repository;
    }

    @Override
    public String getTipo() {
        return "turmas";
    }

    @Override
    public String getTitulo() {
        return "Turmas e matrículas";
    }

    @Override
    public String getDescricao() {
        return "Ocupação das turmas, professor responsável e status.";
    }

    @Override
    protected List<Turma> buscar(RelatorioDTO.Filtro f) {
        Specification<Turma> porId = f.turmaId() == null ? null
                : (root, q, cb) -> cb.equal(root.get("id"), f.turmaId());
        return repository.findAll(todas(turmaDoCurso(f.cursoId()), porId), Sort.by("codigo"));
    }

    @Override
    protected List<String> colunas() {
        return List.of("Código", "Curso", "Professor", "Matriculados", "Capacidade", "Ocupação (%)", "Status");
    }

    @Override
    protected Map<String, Object> resumo(List<Turma> turmas) {
        Map<String, Object> resumo = super.resumo(turmas);
        int matriculas = 0;
        int vagas = 0;
        for (Turma turma : turmas) {
            matriculas += turma.getQuantidadeMatriculados();
            vagas += turma.getCapacidadeMaxima();
        }
        resumo.put("Matrículas", matriculas);
        resumo.put("Vagas totais", vagas);
        resumo.put("Ocupação geral (%)", vagas == 0 ? 0 : Math.round(matriculas * 100.0 / vagas));
        return resumo;
    }
}
