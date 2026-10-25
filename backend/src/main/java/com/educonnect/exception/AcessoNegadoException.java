package com.educonnect.exception;

/** Usuário autenticado sem permissão para o recurso específico. Resulta em HTTP 403. */
public class AcessoNegadoException extends RuntimeException {

    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }
}
