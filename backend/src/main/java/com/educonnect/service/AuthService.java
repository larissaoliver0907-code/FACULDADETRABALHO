package com.educonnect.service;

import com.educonnect.dto.AuthDTO;
import com.educonnect.exception.RecursoNaoEncontradoException;
import com.educonnect.exception.RegraNegocioException;
import com.educonnect.model.Usuario;
import com.educonnect.repository.UsuarioRepository;
import com.educonnect.security.Autenticacao;
import com.educonnect.security.JwtService;
import com.educonnect.security.LimitadorTentativasLogin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Implementação de produção de {@link Autenticacao}: banco de dados + BCrypt + JWT. */
@Service
public class AuthService implements Autenticacao {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LimitadorTentativasLogin limitador;
    /** Hash fictício: mantém o tempo de resposta semelhante quando o login não existe. */
    private final String hashFicticio;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, LimitadorTentativasLogin limitador) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.limitador = limitador;
        this.hashFicticio = passwordEncoder.encode("senha-ficticia-para-tempo-constante-1");
    }

    @Override
    @Transactional(readOnly = true)
    public Usuario autenticar(String login, String senha) {
        String loginNormalizado = login == null ? "" : login.trim().toLowerCase();
        if (limitador.bloqueado(loginNormalizado)) {
            throw new LockedException("Muitas tentativas. Aguarde alguns minutos.");
        }
        Usuario usuario = usuarioRepository.findByLogin(loginNormalizado).orElse(null);
        String hash = usuario != null ? usuario.getSenhaHash() : hashFicticio;
        boolean senhaConfere = senha != null && passwordEncoder.matches(senha, hash);
        if (usuario == null || !senhaConfere || !usuario.isAtivo()) {
            limitador.registrarFalha(loginNormalizado);
            log.info("Falha de autenticação para o login informado.");
            throw new BadCredentialsException("Credenciais inválidas");
        }
        limitador.registrarSucesso(loginNormalizado);
        return usuario;
    }

    public AuthDTO.LoginResponse login(AuthDTO.LoginRequest request) {
        Usuario usuario = autenticar(request.login(), request.senha());
        JwtService.TokenEmitido token = jwtService.emitir(usuario);
        return new AuthDTO.LoginResponse(token.token(), token.expiraEm(), AuthDTO.UsuarioLogado.de(usuario));
    }

    @Transactional(readOnly = true)
    public AuthDTO.UsuarioLogado usuarioLogado(Long id) {
        return usuarioRepository.findById(id)
                .map(AuthDTO.UsuarioLogado::de)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", id));
    }

    @Transactional
    public void alterarPropriaSenha(Long usuarioId, AuthDTO.AlterarSenhaRequest request) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", usuarioId));
        if (!passwordEncoder.matches(request.senhaAtual(), usuario.getSenhaHash())) {
            throw new RegraNegocioException("A senha atual não confere.");
        }
        if (passwordEncoder.matches(request.novaSenha(), usuario.getSenhaHash())) {
            throw new RegraNegocioException("A nova senha deve ser diferente da atual.");
        }
        usuario.definirSenhaHash(passwordEncoder.encode(request.novaSenha()));
    }
}
