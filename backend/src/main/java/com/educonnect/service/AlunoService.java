package com.educonnect.service;

import com.educonnect.dto.AlunoDTO;
import com.educonnect.dto.AvaliacaoDTO;
import com.educonnect.dto.PaginaResponse;
import com.educonnect.dto.TurmaDTO;
import com.educonnect.exception.ConflitoException;
import com.educonnect.exception.RecursoNaoEncontradoException;
import com.educonnect.exception.RegraNegocioException;
import com.educonnect.model.Aluno;
import com.educonnect.model.Curso;
import com.educonnect.model.Turma;
import com.educonnect.repository.AlunoRepository;
import com.educonnect.repository.AvaliacaoRepository;
import com.educonnect.repository.CursoRepository;
import com.educonnect.repository.TurmaRepository;
import com.educonnect.repository.UsuarioRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.educonnect.repository.Especificacoes.alunoAtivo;
import static com.educonnect.repository.Especificacoes.alunoDaTurma;
import static com.educonnect.repository.Especificacoes.alunoDoCurso;
import static com.educonnect.repository.Especificacoes.alunoPorTermo;
import static com.educonnect.repository.Especificacoes.todas;

@Service
public class AlunoService {

    private final AlunoRepository alunoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CursoRepository cursoRepository;
    private final TurmaRepository turmaRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final DesempenhoService desempenhoService;
    private final PasswordEncoder passwordEncoder;
    private final AtividadeService atividades;

    public AlunoService(AlunoRepository alunoRepository, UsuarioRepository usuarioRepository,
                        CursoRepository cursoRepository, TurmaRepository turmaRepository,
                        AvaliacaoRepository avaliacaoRepository, DesempenhoService desempenhoService,
                        PasswordEncoder passwordEncoder, AtividadeService atividades) {
        this.alunoRepository = alunoRepository;
        this.usuarioRepository = usuarioRepository;
        this.cursoRepository = cursoRepository;
        this.turmaRepository = turmaRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.desempenhoService = desempenhoService;
        this.passwordEncoder = passwordEncoder;
        this.atividades = atividades;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<AlunoDTO.Response> listar(String termo, Long cursoId, Long turmaId, Boolean ativo,
                                                    Pageable pageable) {
        var pagina = alunoRepository.findAll(
                todas(alunoPorTermo(termo), alunoDoCurso(cursoId), alunoDaTurma(turmaId), alunoAtivo(ativo)), pageable);
        return PaginaResponse.de(pagina, a -> AlunoDTO.Response.de(a, null));
    }

    @Transactional(readOnly = true)
    public AlunoDTO.Response buscar(Long id) {
        return detalhar(obter(id));
    }

    @Transactional(readOnly = true)
    public AlunoDTO.Response buscarPorLogin(String login) {
        Aluno aluno = alunoRepository.findByLogin(login)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Aluno", login));
        return detalhar(aluno);
    }

    @Transactional
    public AlunoDTO.Response criar(AlunoDTO.Request req) {
        if (req.senha() == null || req.senha().isBlank()) {
            throw new RegraNegocioException("Informe a senha inicial do aluno.");
        }
        String matricula = req.matricula().trim().toUpperCase();
        String login = req.login().trim().toLowerCase();
        if (alunoRepository.existsByMatricula(matricula)) {
            throw new ConflitoException("Já existe um aluno com a matrícula " + matricula + ".");
        }
        if (usuarioRepository.existsByLogin(login)) {
            throw new ConflitoException("O login " + login + " já está em uso.");
        }
        Curso curso = obterCurso(req.cursoId());
        Aluno aluno = new Aluno(req.nome(), login, passwordEncoder.encode(req.senha()), matricula, curso);
        aluno = alunoRepository.save(aluno);
        atividades.registrar("ALUNO", "Aluno cadastrado: " + aluno.getMatricula() + " — " + aluno.getNome());
        return AlunoDTO.Response.de(aluno, List.of());
    }

    @Transactional
    public AlunoDTO.Response atualizar(Long id, AlunoDTO.Request req) {
        Aluno aluno = obter(id);
        String matricula = req.matricula().trim().toUpperCase();
        String login = req.login().trim().toLowerCase();
        if (alunoRepository.existsByMatriculaAndIdNot(matricula, id)) {
            throw new ConflitoException("Já existe um aluno com a matrícula " + matricula + ".");
        }
        if (usuarioRepository.existsByLoginAndIdNot(login, id)) {
            throw new ConflitoException("O login " + login + " já está em uso.");
        }
        Curso novoCurso = obterCurso(req.cursoId());
        if (!novoCurso.equals(aluno.getCurso())) {
            boolean emTurmaAberta = aluno.getTurmas().stream().anyMatch(Turma::isAberta);
            if (emTurmaAberta) {
                throw new RegraNegocioException(
                        "O aluno está matriculado em turmas abertas do curso atual. Remova-o das turmas antes de trocar o curso.");
            }
            aluno.alterarCurso(novoCurso);
        }
        aluno.alterarNome(req.nome());
        aluno.alterarMatricula(matricula);
        aluno.alterarLogin(login);
        if (req.senha() != null && !req.senha().isBlank()) {
            aluno.definirSenhaHash(passwordEncoder.encode(req.senha()));
        }
        atividades.registrar("ALUNO", "Aluno atualizado: " + aluno.getMatricula());
        return detalhar(aluno);
    }

    /** Ativa ou desativa o cadastro. Matrículas e avaliações são preservadas. */
    @Transactional
    public AlunoDTO.Response alterarAtivo(Long id, boolean ativo) {
        Aluno aluno = obter(id);
        if (ativo) {
            aluno.ativar();
        } else {
            aluno.desativar();
        }
        atividades.registrar("ALUNO", "Aluno " + aluno.getMatricula() + (ativo ? " reativado" : " desativado"));
        return detalhar(aluno);
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoDTO.Response> historico(Long alunoId) {
        obter(alunoId);
        return avaliacaoRepository.historicoDoAluno(alunoId).stream().map(AvaliacaoDTO.Response::de).toList();
    }

    @Transactional
    public AlunoDTO.Desempenho desempenho(Long alunoId) {
        return desempenhoService.desempenhoDoAluno(obter(alunoId));
    }

    private AlunoDTO.Response detalhar(Aluno aluno) {
        List<TurmaDTO.Resumo> turmas = turmaRepository.findByAlunoId(aluno.getId()).stream()
                .map(TurmaDTO.Resumo::de).toList();
        return AlunoDTO.Response.de(aluno, turmas);
    }

    private Curso obterCurso(Long cursoId) {
        return cursoRepository.findById(cursoId).orElseThrow(() -> new RecursoNaoEncontradoException("Curso", cursoId));
    }

    Aluno obter(Long id) {
        return alunoRepository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Aluno", id));
    }
}
