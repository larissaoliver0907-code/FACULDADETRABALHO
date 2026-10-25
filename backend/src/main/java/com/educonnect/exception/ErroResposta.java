package com.educonnect.exception;

import java.time.LocalDateTime;
import java.util.Map;

/** Formato padronizado de erro devolvido pela API. */
public record ErroResposta(
        LocalDateTime timestamp,
        int status,
        String erro,
        String mensagem,
        String caminho,
        Map<String, String> campos) {
}
