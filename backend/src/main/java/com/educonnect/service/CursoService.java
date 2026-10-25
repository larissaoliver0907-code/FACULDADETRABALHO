package com.educonnect.service;

import com.educonnect.dto.CursoDTO;
import com.educonnect.dto.PaginaResponse;
import com.educonnect.dto.TurmaDTO;
import com.educonnect.exception.ConflitoException;
import com.educonnect.exception.RecursoNaoEncontradoException;
import com.educonnect.exception.RegraNegocioException;
import com.educonnect.model.Curso;
import com.educonnect.model.CursoEAD;
import com.educonnect.model.CursoPresencial;
import com.educonnect.model.ModalidadeCurso;
import com.educonnect.model.StatusCurso;
import com.educonnect.repository.CursoRepository;
import com.educonnect.repository.TurmaRepository;
import org.hibernate.Hibernate;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.educonnect.repository.Especificacoes.cursoComStatus;
import static com.educonnect.repository.Especificacoes.cursoDaModalidade;
import static com.educonnect.repository.Especificacoes.cursoPorTermo;
import static com.educonnect.repository.Especificacoes.todas;

@Service
public class CursoService {

    private final CursoRepository cursoRepository;
    private final TurmaRepository turmaRepository;
    private final AtividadeService atividades;

    public CursoService(CursoRepository cursoRepository, TurmaRepository turmaRepository, AtividadeService atividades) {
        this.cursoRepository = cursoRepository;
        this.turmaRepository = turmaRepository;
        this.atividades = atividades;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<CursoDTO.Response> listar(String termo, StatusCurso status, ModalidadeCurso modalidade,
                                                    Pageable pageable) {
        var pagina = cursoRepository.findAll(
                todas(cursoPorTermo(termo), cursoComStatus(status), cursoDaModalidade(modalidade)), pageable);
        return PaginaResponse.de(pagina, c -> CursoDTO.Response.de(c, turmaRepository.countByCursoId(c.getId())));
    }

    @Transactional(readOnly = true)
    public List<CursoDTO.Resumo> listarAtivos() {
        return cursoRepository.findByStatusOrderByNomeAsc(StatusCurso.ATIVO).stream().map(CursoDTO.Resumo::de).toList();
    }

    @Transactional(readOnly = true)
    public CursoDTO.Response buscar(Long id) {
        Curso curso = obter(id);
        return CursoDTO.Response.de(curso, turmaRepository.countByCursoId(id));
    }

    @Transactional(readOnly = true)
    public List<TurmaDTO.Response> turmasDoCurso(Long id) {
        obter(id);
        return turmaRepository.findByCursoIdOrderByCodigoAsc(id).stream()
                .map(t -> TurmaDTO.Response.de(t, false)).toList();
    }

    /** Cria um {@link CursoPresencial} ou {@link CursoEAD} conforme a modalidade informada. */
    @Transactional
    public CursoDTO.Response criar(CursoDTO.Request req) {
        String codigo = req.codigo().trim().toUpperCase();
        if (cursoRepository.existsByCodigo(codigo)) {
            throw new ConflitoException("Já existe um curso com o código " + codigo + ".");
        }
        Curso curso = switch (req.modalidade()) {
            case PRESENCIAL -> new CursoPresencial(codigo, req.nome(), req.cargaHoraria(), req.descricao(), req.sala());
            case EAD -> new CursoEAD(codigo, req.nome(), req.cargaHoraria(), req.descricao(), req.plataforma());
        };
        curso = cursoRepository.save(curso);
        atividades.registrar("CURSO", "Curso cadastrado: " + curso.getCodigo() + " — " + curso.getNome());
        return CursoDTO.Response.de(curso, 0L);
    }

    @Transactional
    public CursoDTO.Response atualizar(Long id, CursoDTO.Request req) {
        Curso curso = (Curso) Hibernate.unproxy(obter(id));
        if (curso.getModalidade() != req.modalidade()) {
            throw new RegraNegocioException(
                    "A modalidade de um curso não pode ser alterada. Cadastre um novo curso na modalidade desejada.");
        }
        String codigo = req.codigo().trim().toUpperCase();
        if (cursoRepository.existsByCodigoAndIdNot(codigo, id)) {
            throw new ConflitoException("Já existe um curso com o código " + codigo + ".");
        }
        curso.alterarCodigo(codigo);
        curso.atualizarDados(req.nome(), req.cargaHoraria(), req.descricao());
        if (curso instanceof CursoPresencial presencial) {
            presencial.alterarSala(req.sala());
        } else if (curso instanceof CursoEAD ead) {
            ead.alterarPlataforma(req.plataforma());
        }
        atividades.registrar("CURSO", "Curso atualizado: " + curso.getCodigo());
        return CursoDTO.Response.de(curso, turmaRepository.countByCursoId(id));
    }

    @Transactional
    public CursoDTO.Response alterarStatus(Long id, StatusCurso status) {
        Curso curso = obter(id);
        if (status == StatusCurso.ATIVO) {
            curso.ativar();
        } else {
            curso.inativar();
        }
        atividades.registrar("CURSO", "Curso " + curso.getCodigo() + (curso.isAtivo() ? " ativado" : " inativado"));
        return CursoDTO.Response.de(curso, turmaRepository.countByCursoId(id));
    }

    Curso obter(Long id) {
        return cursoRepository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Curso", id));
    }
}
