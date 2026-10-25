package com.educonnect.service;

import com.educonnect.dto.PaginaResponse;
import com.educonnect.dto.UsuarioDTO;
import com.educonnect.exception.ConflitoException;
import com.educonnect.exception.RecursoNaoEncontradoException;
import com.educonnect.exception.RegraNegocioException;
import com.educonnect.model.Administrador;
import com.educonnect.model.Perfil;
import com.educonnect.model.Usuario;
import com.educonnect.repository.UsuarioRepository;
import com.educonnect.security.UsuarioAtual;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Gestão de contas de acesso: listagem, administradores, ativação e redefinição de senha. */
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioAtual usuarioAtual;
    private final AtividadeService atividades;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                          UsuarioAtual usuarioAtual, AtividadeService atividades) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.usuarioAtual = usuarioAtual;
        this.atividades = atividades;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<UsuarioDTO.Response> listar(String termo, Pageable pageable) {
        String padrao = "%" + (termo == null ? "" : termo.trim().toLowerCase()) + "%";
        return PaginaResponse.de(usuarioRepository.pesquisar(padrao, pageable), UsuarioDTO.Response::de);
    }

    @Transactional
    public UsuarioDTO.Response criarAdministrador(UsuarioDTO.AdministradorRequest req) {
        String login = req.login().trim().toLowerCase();
        if (usuarioRepository.existsByLogin(login)) {
            throw new ConflitoException("O login " + login + " já está em uso.");
        }
        Administrador admin = usuarioRepository.save(
                new Administrador(req.nome(), login, passwordEncoder.encode(req.senha())));
        atividades.registrar("USUARIO", "Administrador cadastrado: " + admin.getLogin());
        return UsuarioDTO.Response.de(admin);
    }

    @Transactional
    public UsuarioDTO.Response alterarAtivo(Long id, boolean ativo) {
        Usuario usuario = obter(id);
        if (!ativo && usuario.getId().equals(usuarioAtual.obter().id())) {
            throw new RegraNegocioException("Você não pode desativar a própria conta.");
        }
        if (!ativo && usuario.getPerfil() == Perfil.ADMINISTRADOR
                && usuarioRepository.countByPerfilAndAtivoTrue(Perfil.ADMINISTRADOR) <= 1) {
            throw new RegraNegocioException("O sistema precisa de pelo menos um administrador ativo.");
        }
        if (ativo) {
            usuario.ativar();
        } else {
            usuario.desativar();
        }
        atividades.registrar("USUARIO", "Conta " + usuario.getLogin() + (ativo ? " ativada" : " desativada"));
        return UsuarioDTO.Response.de(usuario);
    }

    @Transactional
    public void redefinirSenha(Long id, UsuarioDTO.RedefinirSenhaRequest req) {
        Usuario usuario = obter(id);
        usuario.definirSenhaHash(passwordEncoder.encode(req.novaSenha()));
        atividades.registrar("USUARIO", "Senha redefinida para a conta " + usuario.getLogin());
    }

    private Usuario obter(Long id) {
        return usuarioRepository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", id));
    }
}
