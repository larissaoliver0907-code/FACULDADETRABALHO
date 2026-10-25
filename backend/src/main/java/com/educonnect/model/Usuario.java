package com.educonnect.model;

import com.educonnect.exception.RegraNegocioException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Abstração comum a todos os usuários do sistema (aluno, professor e administrador).
 * <p>
 * A senha nunca é armazenada em texto puro: a entidade guarda apenas o hash, que é
 * produzido pela camada de serviço com um {@code PasswordEncoder} (BCrypt).
 */
@Entity
@Table(name = "usuarios")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Usuario implements Relatavel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, unique = true, length = 60)
    private String login;

    @Column(name = "senha_hash", nullable = false, length = 100)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Perfil perfil;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    /** Construtor exigido pelo JPA. */
    protected Usuario() {
    }

    protected Usuario(String nome, String login, String senhaHash, Perfil perfil) {
        this.perfil = Objects.requireNonNull(perfil, "perfil");
        alterarNome(nome);
        alterarLogin(login);
        definirSenhaHash(senhaHash);
        this.criadoEm = LocalDateTime.now();
    }

    /** Identificação institucional exibida na interface (matrícula, registro ou login). */
    public abstract String getIdentificacao();

    public void alterarNome(String nome) {
        if (nome == null || nome.isBlank()) {
            throw new RegraNegocioException("O nome é obrigatório.");
        }
        this.nome = nome.trim();
    }

    public void alterarLogin(String login) {
        if (login == null || login.isBlank()) {
            throw new RegraNegocioException("O login é obrigatório.");
        }
        this.login = login.trim().toLowerCase();
    }

    /** Recebe somente o hash já calculado; a senha em texto puro nunca chega à entidade. */
    public void definirSenhaHash(String senhaHash) {
        if (senhaHash == null || senhaHash.isBlank()) {
            throw new RegraNegocioException("A senha é obrigatória.");
        }
        this.senhaHash = senhaHash;
    }

    public void ativar() {
        this.ativo = true;
    }

    public void desativar() {
        this.ativo = false;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getLogin() {
        return login;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public Perfil getPerfil() {
        return perfil;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Usuario outro)) return false;
        return id != null && id.equals(outro.getId());
    }

    @Override
    public int hashCode() {
        // Constante para permanecer estável antes/depois da persistência e com proxies do Hibernate.
        return Usuario.class.hashCode();
    }
}
