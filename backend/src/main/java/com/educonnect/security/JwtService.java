package com.educonnect.security;

import com.educonnect.model.Perfil;
import com.educonnect.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

/** Emissão e validação de tokens JWT assinados com HMAC-SHA256. */
@Service
public class JwtService {

    private static final String EMISSOR = "educonnect";

    private final SecretKey chave;
    private final long expiracaoMinutos;

    public JwtService(@Value("${educonnect.security.jwt-secret}") String segredo,
                      @Value("${educonnect.security.jwt-expiration-minutes:120}") long expiracaoMinutos) {
        if (segredo == null || segredo.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "Defina a variável de ambiente JWT_SECRET com pelo menos 32 caracteres.");
        }
        this.chave = Keys.hmacShaKeyFor(segredo.getBytes(StandardCharsets.UTF_8));
        this.expiracaoMinutos = expiracaoMinutos;
    }

    public TokenEmitido emitir(Usuario usuario) {
        Instant agora = Instant.now();
        Instant expira = agora.plus(expiracaoMinutos, ChronoUnit.MINUTES);
        String token = Jwts.builder()
                .issuer(EMISSOR)
                .subject(String.valueOf(usuario.getId()))
                .claim("login", usuario.getLogin())
                .claim("perfil", usuario.getPerfil().name())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(expira))
                .signWith(chave)
                .compact();
        return new TokenEmitido(token, expira);
    }

    /** Valida assinatura, emissor e expiração. Devolve vazio para qualquer token inválido. */
    public Optional<UsuarioAutenticado> validar(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(chave)
                    .requireIssuer(EMISSOR)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(new UsuarioAutenticado(
                    Long.valueOf(claims.getSubject()),
                    claims.get("login", String.class),
                    Perfil.valueOf(claims.get("perfil", String.class))));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public record TokenEmitido(String token, Instant expiraEm) {
    }
}
