package com.educonnect.service.relatorio;

import com.educonnect.dto.RelatorioDTO;
import com.educonnect.model.Aluno;
import com.educonnect.repository.AlunoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

import static com.educonnect.repository.Especificacoes.alunoDaTurma;
import static com.educonnect.repository.Especificacoes.alunoDoCurso;
import static com.educonnect.repository.Especificacoes.todas;

@Component
public class RelatorioAlunos extends RelatorioBase<Aluno> {

    private final AlunoRepository repository;

    public RelatorioAlunos(AlunoRepository repository) {
        this.repository = repository;
    }

    @Override
    public String getTipo() {
        return "alunos";
    }

    @Override
    public String getTitulo() {
        return "Alunos cadastrados";
    }

    @Override
    public String getDescricao() {
        return "Matrícula, curso, quantidade de turmas e situação do cadastro.";
    }

    @Override
    protected List<Aluno> buscar(RelatorioDTO.Filtro f) {
        return repository.findAll(todas(alunoDoCurso(f.cursoId()), alunoDaTurma(f.turmaId())), Sort.by("nome"));
    }

    @Override
    protected List<String> colunas() {
        return List.of("Matrícula", "Nome", "Curso", "Turmas", "Situação");
    }

    @Override
    protected Map<String, Object> resumo(List<Aluno> alunos) {
        Map<String, Object> resumo = super.resumo(alunos);
        long ativos = alunos.stream().filter(Aluno::isAtivo).count();
        resumo.put("Ativos", ativos);
        resumo.put("Inativos", alunos.size() - ativos);
        return resumo;
    }
}
