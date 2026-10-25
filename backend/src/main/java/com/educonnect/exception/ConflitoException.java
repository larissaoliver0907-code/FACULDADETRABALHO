package com.educonnect.exception;

/** Conflito com dados existentes (ex.: matrícula, login ou código já cadastrado). Resulta em HTTP 409. */
public class ConflitoException extends RuntimeException {

    public ConflitoException(String mensagem) {
        super(mensagem);
    }
}
