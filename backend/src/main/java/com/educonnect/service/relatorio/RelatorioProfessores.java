package com.educonnect.service.relatorio;

import com.educonnect.dto.RelatorioDTO;
import com.educonnect.model.Professor;
import com.educonnect.repository.ProfessorRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.List;

import static com.educonnect.repository.Especificacoes.professorDoCurso;
import static com.educonnect.repository.Especificacoes.todas;

@Component
public class RelatorioProfessores extends RelatorioBase<Professor> {

    private final ProfessorRepository repository;

    public RelatorioProfessores(ProfessorRepository repository) {
        this.repository = repository;
    }

    @Override
    public String getTipo() {
        return "professores";
    }

    @Override
    public String getTitulo() {
        return "Professores";
    }

    @Override
    public String getDescricao() {
        return "Registro, especialidade, cursos e turmas de cada professor.";
    }

    @Override
    protected List<Professor> buscar(RelatorioDTO.Filtro f) {
        return repository.findAll(todas(professorDoCurso(f.cursoId())), Sort.by("nome"));
    }

    @Override
    protected List<String> colunas() {
        return List.of("Registro", "Nome", "Especialidade", "Cursos", "Turmas", "Situação");
    }
}
