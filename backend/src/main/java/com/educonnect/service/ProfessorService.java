package com.educonnect.service;

import com.educonnect.dto.PaginaResponse;
import com.educonnect.dto.ProfessorDTO;
import com.educonnect.dto.TurmaDTO;
import com.educonnect.exception.ConflitoException;
import com.educonnect.exception.RecursoNaoEncontradoException;
import com.educonnect.exception.RegraNegocioException;
import com.educonnect.model.Curso;
import com.educonnect.model.Professor;
import com.educonnect.model.Turma;
import com.educonnect.repository.CursoRepository;
import com.educonnect.repository.ProfessorRepository;
import com.educonnect.repository.TurmaRepository;
import com.educonnect.repository.UsuarioRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.educonnect.repository.Especificacoes.professorAtivo;
import static com.educonnect.repository.Especificacoes.professorDoCurso;
import static com.educonnect.repository.Especificacoes.professorPorTermo;
import static com.educonnect.repository.Especificacoes.todas;

@Service
public class ProfessorService {

    private final ProfessorRepository professorRepository;
    private final UsuarioRepository usuarioRepository;
    private final CursoRepository cursoRepository;
    private final TurmaRepository turmaRepository;
    private final PasswordEncoder passwordEncoder;
    private final AtividadeService atividades;

    public ProfessorService(ProfessorRepository professorRepository, UsuarioRepository usuarioRepository,
                            CursoRepository cursoRepository, TurmaRepository turmaRepository,
                            PasswordEncoder passwordEncoder, AtividadeService atividades) {
        this.professorRepository = professorRepository;
        this.usuarioRepository = usuarioRepository;
        this.cursoRepository = cursoRepository;
        this.turmaRepository = turmaRepository;
        this.passwordEncoder = passwordEncoder;
        this.atividades = atividades;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<ProfessorDTO.Response> listar(String termo, Boolean ativo, Long cursoId, Pageable pageable) {
        var pagina = professorRepository.findAll(
                todas(professorPorTermo(termo), professorAtivo(ativo), professorDoCurso(cursoId)), pageable);
        return PaginaResponse.de(pagina, ProfessorDTO.Response::de);
    }

    @Transactional(readOnly = true)
    public ProfessorDTO.Response buscar(Long id) {
        return ProfessorDTO.Response.de(obter(id));
    }

    @Transactional(readOnly = true)
    public List<TurmaDTO.Response> turmasDoProfessor(Long id) {
        obter(id);
        return turmaRepository.findByProfessorIdOrderByCodigoAsc(id).stream()
                .map(t -> TurmaDTO.Response.de(t, false)).toList();
    }

    @Transactional
    public ProfessorDTO.Response criar(ProfessorDTO.Request req) {
        if (req.senha() == null || req.senha().isBlank()) {
            throw new RegraNegocioException("Informe a senha inicial do professor.");
        }
        String registro = req.registro().trim().toUpperCase();
        String login = req.login().trim().toLowerCase();
        if (professorRepository.existsByRegistro(registro)) {
            throw new ConflitoException("Já existe um professor com o registro " + registro + ".");
        }
        if (usuarioRepository.existsByLogin(login)) {
            throw new ConflitoException("O login " + login + " já está em uso.");
        }
        Professor professor = new Professor(req.nome(), login, passwordEncoder.encode(req.senha()),
                registro, req.especialidade());
        professor.definirCursos(carregarCursos(req.cursoIds()));
        professor = professorRepository.save(professor);
        atividades.registrar("PROFESSOR", "Professor cadastrado: " + professor.getNome());
        return ProfessorDTO.Response.de(professor);
    }

    @Transactional
    public ProfessorDTO.Response atualizar(Long id, ProfessorDTO.Request req) {
        Professor professor = obter(id);
        String registro = req.registro().trim().toUpperCase();
        String login = req.login().trim().toLowerCase();
        if (professorRepository.existsByRegistroAndIdNot(registro, id)) {
            throw new ConflitoException("Já existe um professor com o registro " + registro + ".");
        }
        if (usuarioRepository.existsByLoginAndIdNot(login, id)) {
            throw new ConflitoException("O login " + login + " já está em uso.");
        }
        Set<Curso> cursos = carregarCursos(req.cursoIds());
        // Não permite remover um curso enquanto o professor for responsável por turmas dele.
        for (Turma turma : professor.getTurmas()) {
            if (!cursos.contains(turma.getCurso())) {
                throw new RegraNegocioException("O professor é responsável pela turma " + turma.getCodigo()
                        + " do curso " + turma.getCurso().getCodigo() + ". Troque o responsável antes de remover o curso.");
            }
        }
        professor.alterarNome(req.nome());
        professor.alterarRegistro(registro);
        professor.alterarEspecialidade(req.especialidade());
        professor.alterarLogin(login);
        professor.definirCursos(cursos);
        if (req.senha() != null && !req.senha().isBlank()) {
            professor.definirSenhaHash(passwordEncoder.encode(req.senha()));
        }
        atividades.registrar("PROFESSOR", "Professor atualizado: " + professor.getNome());
        return ProfessorDTO.Response.de(professor);
    }

    @Transactional
    public ProfessorDTO.Response alterarAtivo(Long id, boolean ativo) {
        Professor professor = obter(id);
        if (ativo) {
            professor.ativar();
        } else {
            boolean temTurmaAberta = professor.getTurmas().stream().anyMatch(Turma::isAberta);
            if (temTurmaAberta) {
                throw new RegraNegocioException(
                        "O professor é responsável por turmas abertas. Troque o responsável antes de desativá-lo.");
            }
            professor.desativar();
        }
        atividades.registrar("PROFESSOR", "Professor " + professor.getNome() + (ativo ? " ativado" : " desativado"));
        return ProfessorDTO.Response.de(professor);
    }

    private Set<Curso> carregarCursos(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new HashSet<>();
        }
        List<Curso> cursos = cursoRepository.findAllById(ids);
        if (cursos.size() != ids.size()) {
            throw new RecursoNaoEncontradoException("Curso", ids);
        }
        return new HashSet<>(cursos);
    }

    Professor obter(Long id) {
        return professorRepository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Professor", id));
    }
}
