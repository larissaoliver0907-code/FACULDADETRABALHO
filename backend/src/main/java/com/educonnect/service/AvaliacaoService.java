package com.educonnect.service;

import com.educonnect.dto.AvaliacaoDTO;
import com.educonnect.dto.PaginaResponse;
import com.educonnect.exception.AcessoNegadoException;
import com.educonnect.exception.RecursoNaoEncontradoException;
import com.educonnect.exception.RegraNegocioException;
import com.educonnect.model.Aluno;
import com.educonnect.model.Avaliacao;
import com.educonnect.model.Turma;
import com.educonnect.repository.AlunoRepository;
import com.educonnect.repository.AvaliacaoRepository;
import com.educonnect.security.UsuarioAtual;
import com.educonnect.security.UsuarioAutenticado;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.educonnect.repository.Especificacoes.avaliacaoDaTurma;
import static com.educonnect.repository.Especificacoes.avaliacaoDoAluno;
import static com.educonnect.repository.Especificacoes.avaliacaoDoCurso;
import static com.educonnect.repository.Especificacoes.avaliacaoDoProfessor;
import static com.educonnect.repository.Especificacoes.avaliacaoNoPeriodo;
import static com.educonnect.repository.Especificacoes.todas;

/**
 * Lançamento e consulta de avaliações.
 * Professores registram e editam apenas avaliações das próprias turmas abertas;
 * administradores podem corrigir avaliações de qualquer turma.
 */
@Service
public class AvaliacaoService {

    private final AvaliacaoRepository avaliacaoRepository;
    private final AlunoRepository alunoRepository;
    private final TurmaService turmaService;
    private final UsuarioAtual usuarioAtual;
    private final AtividadeService atividades;

    public AvaliacaoService(AvaliacaoRepository avaliacaoRepository, AlunoRepository alunoRepository,
                            TurmaService turmaService, UsuarioAtual usuarioAtual, AtividadeService atividades) {
        this.avaliacaoRepository = avaliacaoRepository;
        this.alunoRepository = alunoRepository;
        this.turmaService = turmaService;
        this.usuarioAtual = usuarioAtual;
        this.atividades = atividades;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<AvaliacaoDTO.Response> listar(Long turmaId, Long alunoId, Long cursoId, Pageable pageable) {
        UsuarioAutenticado usuario = usuarioAtual.obter();
        Long professorId = usuario.isProfessor() ? usuario.id() : null;
        var pagina = avaliacaoRepository.findAll(todas(avaliacaoDaTurma(turmaId), avaliacaoDoAluno(alunoId),
                avaliacaoDoCurso(cursoId), avaliacaoDoProfessor(professorId), avaliacaoNoPeriodo(null, null)), pageable);
        return PaginaResponse.de(pagina, AvaliacaoDTO.Response::de);
    }

    @Transactional
    public AvaliacaoDTO.Response criar(AvaliacaoDTO.Request req) {
        Turma turma = turmaService.obter(req.turmaId());
        turmaService.verificarAcesso(turma);
        Aluno aluno = alunoRepository.findById(req.alunoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Aluno", req.alunoId()));
        Avaliacao avaliacao = new Avaliacao(aluno, turma, req.descricao(), req.nota(), req.data());
        avaliacao = avaliacaoRepository.save(avaliacao);
        atividades.registrar("AVALIACAO",
                "Avaliação \"" + avaliacao.getDescricao() + "\" lançada na turma " + turma.getCodigo());
        return AvaliacaoDTO.Response.de(avaliacao);
    }

    @Transactional
    public AvaliacaoDTO.Response atualizar(Long id, AvaliacaoDTO.AtualizacaoRequest req) {
        Avaliacao avaliacao = obter(id);
        verificarEdicao(avaliacao);
        avaliacao.alterarDescricao(req.descricao());
        avaliacao.alterarData(req.data());
        avaliacao.atribuirNota(req.nota());
        atividades.registrar("AVALIACAO", "Avaliação atualizada na turma " + avaliacao.getTurma().getCodigo());
        return AvaliacaoDTO.Response.de(avaliacao);
    }

    @Transactional
    public void excluir(Long id) {
        Avaliacao avaliacao = obter(id);
        if (!usuarioAtual.obter().isAdministrador()) {
            throw new AcessoNegadoException("Somente administradores podem excluir avaliações.");
        }
        avaliacaoRepository.delete(avaliacao);
        atividades.registrar("AVALIACAO", "Avaliação excluída da turma " + avaliacao.getTurma().getCodigo());
    }

    private void verificarEdicao(Avaliacao avaliacao) {
        Turma turma = avaliacao.getTurma();
        turmaService.verificarAcesso(turma);
        if (usuarioAtual.obter().isProfessor() && !turma.isAberta()) {
            throw new RegraNegocioException(
                    "A turma " + turma.getCodigo() + " não está aberta. Solicite a correção a um administrador.");
        }
    }

    private Avaliacao obter(Long id) {
        return avaliacaoRepository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Avaliação", id));
    }
}
