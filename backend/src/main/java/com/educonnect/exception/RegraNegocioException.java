package com.educonnect.exception;

/** Violação de uma regra de negócio. Resulta em HTTP 422 com a mensagem para o usuário. */
public class RegraNegocioException extends RuntimeException {

    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
