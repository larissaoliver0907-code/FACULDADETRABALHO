package com.educonnect.dto;

import com.educonnect.model.Perfil;
import com.educonnect.model.Usuario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class UsuarioDTO {

    private UsuarioDTO() {
    }

    public record Response(Long id, String nome, String login, Perfil perfil, String identificacao,
                           boolean ativo, LocalDateTime criadoEm) {
        public static Response de(Usuario u) {
            return new Response(u.getId(), u.getNome(), u.getLogin(), u.getPerfil(), u.getIdentificacao(),
                    u.isAtivo(), u.getCriadoEm());
        }
    }

    public record AdministradorRequest(
            @NotBlank(message = "Informe o nome.") @Size(max = 120) String nome,
            @NotBlank(message = "Informe o login.")
            @Pattern(regexp = Validacoes.LOGIN_REGEX, message = Validacoes.LOGIN_MENSAGEM) String login,
            @NotBlank(message = "Informe a senha.")
            @Pattern(regexp = Validacoes.SENHA_REGEX, message = Validacoes.SENHA_MENSAGEM) String senha) {

        @Override
        public String toString() {
            return "AdministradorRequest[login=" + login + "]";
        }
    }

    public record RedefinirSenhaRequest(
            @NotBlank(message = "Informe a nova senha.")
            @Pattern(regexp = Validacoes.SENHA_REGEX, message = Validacoes.SENHA_MENSAGEM) String novaSenha) {

        @Override
        public String toString() {
            return "RedefinirSenhaRequest[***]";
        }
    }
}
