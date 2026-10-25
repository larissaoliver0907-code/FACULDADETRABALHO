package com.educonnect.dto;

import com.educonnect.model.Perfil;
import com.educonnect.model.Usuario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class AuthDTO {

    private AuthDTO() {
    }

    public record LoginRequest(
            @NotBlank(message = "Informe o login.") @Size(max = 60) String login,
            @NotBlank(message = "Informe a senha.") @Size(max = 72) String senha) {

        /** Evita que a senha apareça em logs caso o objeto seja impresso. */
        @Override
        public String toString() {
            return "LoginRequest[login=" + login + "]";
        }
    }

    public record LoginResponse(String token, Instant expiraEm, UsuarioLogado usuario) {
    }

    public record UsuarioLogado(Long id, String nome, String login, Perfil perfil, String identificacao) {
        public static UsuarioLogado de(Usuario u) {
            return new UsuarioLogado(u.getId(), u.getNome(), u.getLogin(), u.getPerfil(), u.getIdentificacao());
        }
    }

    public record AlterarSenhaRequest(
            @NotBlank(message = "Informe a senha atual.") String senhaAtual,
            @NotBlank(message = "Informe a nova senha.")
            @Pattern(regexp = Validacoes.SENHA_REGEX, message = Validacoes.SENHA_MENSAGEM) String novaSenha) {

        @Override
        public String toString() {
            return "AlterarSenhaRequest[***]";
        }
    }
}
