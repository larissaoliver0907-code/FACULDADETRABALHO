package com.educonnect.dto;

/** Expressões e mensagens de validação compartilhadas pelos DTOs. */
public final class Validacoes {

    /** Senha: 8 a 72 caracteres (limite do BCrypt), com ao menos uma letra e um número. */
    public static final String SENHA_REGEX = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$";
    public static final String SENHA_MENSAGEM =
            "A senha deve ter de 8 a 72 caracteres, com pelo menos uma letra e um número.";

    public static final String LOGIN_REGEX = "^[A-Za-z0-9._-]{3,60}$";
    public static final String LOGIN_MENSAGEM =
            "O login deve ter de 3 a 60 caracteres: letras, números, ponto, hífen ou sublinhado.";

    public static final String CODIGO_REGEX = "^[A-Za-z0-9][A-Za-z0-9-]{1,19}$";
    public static final String CODIGO_MENSAGEM = "Use de 2 a 20 letras, números ou hífen.";

    public static final String MATRICULA_REGEX = "^[A-Za-z0-9]{4,20}$";
    public static final String MATRICULA_MENSAGEM = "A matrícula deve ter de 4 a 20 letras ou números.";

    private Validacoes() {
    }
}
