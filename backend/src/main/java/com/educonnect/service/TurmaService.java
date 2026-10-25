package com.educonnect.service;

import com.educonnect.dto.PaginaResponse;
import com.educonnect.dto.TurmaDTO;
import com.educonnect.exception.AcessoNegadoException;
import com.educonnect.exception.ConflitoException;
import com.educonnect.exception.RecursoNaoEncontradoException;
import com.educonnect.exception.RegraNegocioException;
import com.educonnect.model.Aluno;
import com.educonnect.model.Curso;
import com.educonnect.model.Professor;
import com.educonnect.model.StatusTurma;
import com.educonnect.model.Turma;
import com.educonnect.repository.AlunoRepository;
import com.educonnect.repository.CursoRepository;
import com.educonnect.repository.ProfessorRepository;
import com.educonnect.repository.TurmaRepository;
import com.educonnect.security.UsuarioAtual;
import com.educonnect.security.UsuarioAutenticado;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.educonnect.repository.Especificacoes.todas;
import static com.educonnect.repository.Especificacoes.turmaComStatus;
import static com.educonnect.repository.Especificacoes.turmaDoCurso;
import static com.educonnect.repository.Especificacoes.turmaDoProfessor;
import static com.educonnect.repository.Especificacoes.turmaPorTermo;

@Service
public class TurmaService {

    private final TurmaRepository turmaRepository;
    private final CursoRepository cursoRepository;
    private final ProfessorRepository professorRepository;
    private final AlunoRepository alunoRepository;
    private final UsuarioAtual usuarioAtual;
    private final AtividadeService atividades;

    public TurmaService(TurmaRepository turmaRepository, CursoRepository cursoRepository,
                        ProfessorRepository professorRepository, AlunoRepository alunoRepository,
                        UsuarioAtual usuarioAtual, AtividadeService atividades) {
        this.turmaRepository = turmaRepository;
        this.cursoRepository = cursoRepository;
        this.professorRepository = professorRepository;
        this.alunoRepository = alunoRepository;
        this.usuarioAtual = usuarioAtual;
        this.atividades = atividades;
    }

    /** Administradores veem todas as turmas; professores, somente as turmas sob sua responsabilidade. */
    @Transactional(readOnly = true)
    public PaginaResponse<TurmaDTO.Response> listar(String termo, Long cursoId, Long professorId, StatusTurma status,
                                                    Pageable pageable) {
        UsuarioAutenticado usuario = usuarioAtual.obter();
        Long filtroProfessor = usuario.isProfessor() ? usuario.id() : professorId;
        var pagina = turmaRepository.findAll(todas(turmaPorTermo(termo), turmaDoCurso(cursoId),
                turmaDoProfessor(filtroProfessor), turmaComStatus(status)), pageable);
        return PaginaResponse.de(pagina, t -> TurmaDTO.Response.de(t, false));
    }

    @Transactional(readOnly = true)
    public TurmaDTO.Response buscar(Long id) {
        Turma turma = obter(id);
        verificarAcesso(turma);
        return TurmaDTO.Response.de(turma, true);
    }

    @Transactional
    public TurmaDTO.Response criar(TurmaDTO.Request req) {
        String codigo = req.codigo().trim().toUpperCase();
        if (turmaRepository.existsByCodigo(codigo)) {
            throw new ConflitoException("Já existe uma turma com o código " + codigo + ".");
        }
        Turma turma = new Turma(codigo, obterCurso(req.cursoId()), req.capacidadeMaxima());
        if (req.professorId() != null) {
            turma.associarProfessor(obterProfessor(req.professorId()));
        }
        if (req.status() != null) {
            turma.alterarStatus(req.status());
        }
        turma = turmaRepository.save(turma);
        atividades.registrar("TURMA", "Turma criada: " + turma.getCodigo() + " (" + turma.getCurso().getCodigo() + ")");
        return TurmaDTO.Response.de(turma, true);
    }

    @Transactional
    public TurmaDTO.Response atualizar(Long id, TurmaDTO.Request req) {
        Turma turma = obter(id);
        String codigo = req.codigo().trim().toUpperCase();
        if (turmaRepository.existsByCodigoAndIdNot(codigo, id)) {
            throw new ConflitoException("Já existe uma turma com o código " + codigo + ".");
        }
        Curso curso = obterCurso(req.cursoId());
        if (!curso.equals(turma.getCurso())) {
            // Ao trocar de curso, o professor atual pode não lecionar no novo curso.
            turma.removerProfessor();
            turma.associarCurso(curso);
        }
        if (req.professorId() == null) {
            turma.removerProfessor();
        } else if (turma.getProfessor() == null || !req.professorId().equals(turma.getProfessor().getId())) {
            turma.associarProfessor(obterProfessor(req.professorId()));
        }
        turma.alterarCodigo(codigo);
        turma.alterarCapacidade(req.capacidadeMaxima());
        if (req.status() != null) {
            turma.alterarStatus(req.status());
        }
        atividades.registrar("TURMA", "Turma atualizada: " + turma.getCodigo());
        return TurmaDTO.Response.de(turma, true);
    }

    @Transactional
    public TurmaDTO.Response matricular(Long turmaId, Long alunoId) {
        Turma turma = obter(turmaId);
        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Aluno", alunoId));
        turma.adicionarAluno(aluno);
        atividades.registrar("MATRICULA", "Aluno " + aluno.getMatricula() + " matriculado na turma " + turma.getCodigo());
        return TurmaDTO.Response.de(turma, true);
    }

    @Transactional
    public TurmaDTO.Response desmatricular(Long turmaId, Long alunoId) {
        Turma turma = obter(turmaId);
        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Aluno", alunoId));
        turma.removerAluno(aluno);
        atividades.registrar("MATRICULA", "Aluno " + aluno.getMatricula() + " removido da turma " + turma.getCodigo());
        return TurmaDTO.Response.de(turma, true);
    }

    /** Professores só acessam as próprias turmas; administradores acessam todas. */
    public void verificarAcesso(Turma turma) {
        UsuarioAutenticado usuario = usuarioAtual.obter();
        if (usuario.isAdministrador()) {
            return;
        }
        if (usuario.isProfessor() && turma.getProfessor() != null && usuario.id().equals(turma.getProfessor().getId())) {
            return;
        }
        throw new AcessoNegadoException("Você não tem acesso à turma " + turma.getCodigo() + ".");
    }

    Turma obter(Long id) {
        return turmaRepository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Turma", id));
    }

    private Curso obterCurso(Long id) {
        return cursoRepository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Curso", id));
    }

    private Professor obterProfessor(Long id) {
        Professor professor = professorRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Professor", id));
        if (!professor.isAtivo()) {
            throw new RegraNegocioException("O professor " + professor.getNome() + " está inativo.");
        }
        return professor;
    }
}
