package com.educonnect.security;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Proteção simples contra força bruta: após {@value #MAXIMO_FALHAS} falhas seguidas para o mesmo login,
 * novas tentativas ficam bloqueadas por {@code BLOQUEIO}. Mantido em memória (uma instância);
 * em implantações com várias instâncias, substitua por um armazenamento compartilhado.
 */
@Component
public class LimitadorTentativasLogin {

    static final int MAXIMO_FALHAS = 5;
    private static final Duration BLOQUEIO = Duration.ofMinutes(15);

    private final Map<String, Registro> registros = new ConcurrentHashMap<>();

    public boolean bloqueado(String login) {
        Registro r = registros.get(chave(login));
        if (r == null) {
            return false;
        }
        if (r.bloqueadoAte() != null && Instant.now().isBefore(r.bloqueadoAte())) {
            return true;
        }
        if (r.bloqueadoAte() != null) {
            registros.remove(chave(login));
        }
        return false;
    }

    public void registrarFalha(String login) {
        registros.compute(chave(login), (k, atual) -> {
            int falhas = atual == null ? 1 : atual.falhas() + 1;
            Instant bloqueio = falhas >= MAXIMO_FALHAS ? Instant.now().plus(BLOQUEIO) : null;
            return new Registro(falhas, bloqueio);
        });
    }

    public void registrarSucesso(String login) {
        registros.remove(chave(login));
    }

    private static String chave(String login) {
        return login == null ? "" : login.trim().toLowerCase();
    }

    private record Registro(int falhas, Instant bloqueadoAte) {
    }
}
