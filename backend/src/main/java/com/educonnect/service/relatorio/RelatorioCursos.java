package com.educonnect.service.relatorio;

import com.educonnect.dto.RelatorioDTO;
import com.educonnect.model.Curso;
import com.educonnect.model.ModalidadeCurso;
import com.educonnect.repository.CursoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class RelatorioCursos extends RelatorioBase<Curso> {

    private final CursoRepository repository;

    public RelatorioCursos(CursoRepository repository) {
        this.repository = repository;
    }

    @Override
    public String getTipo() {
        return "cursos";
    }

    @Override
    public String getTitulo() {
        return "Cursos";
    }

    @Override
    public String getDescricao() {
        return "Cursos presenciais e EAD com carga horária, status e local das aulas.";
    }

    @Override
    protected List<Curso> buscar(RelatorioDTO.Filtro f) {
        if (f.cursoId() != null) {
            return repository.findById(f.cursoId()).map(List::of).orElse(List.of());
        }
        return repository.findAll(Sort.by("nome"));
    }

    @Override
    protected List<String> colunas() {
        return List.of("Código", "Nome", "Modalidade", "Carga horária (h)", "Status", "Local das aulas");
    }

    @Override
    protected Map<String, Object> resumo(List<Curso> cursos) {
        Map<String, Object> resumo = super.resumo(cursos);
        long ead = cursos.stream().filter(c -> c.getModalidade() == ModalidadeCurso.EAD).count();
        resumo.put("Presenciais", cursos.size() - ead);
        resumo.put("EAD", ead);
        return resumo;
    }
}
