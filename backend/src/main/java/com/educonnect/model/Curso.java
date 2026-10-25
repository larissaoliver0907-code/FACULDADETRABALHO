package com.educonnect.model;

import com.educonnect.exception.RegraNegocioException;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.DiscriminatorType;
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
import java.util.LinkedHashMap;
import java.util.regex.Pattern;

/**
 * Curso oferecido pela instituição. É abstrato: todo curso concreto é
 * {@link CursoPresencial} ou {@link CursoEAD}, e cada subclasse informa como e onde
 * as aulas acontecem (polimorfismo em {@link #getLocalAulas()} e {@link #gerarRelatorio()}).
 */
@Entity
@Table(name = "cursos")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "tipo", discriminatorType = DiscriminatorType.STRING, length = 20)
public abstract class Curso implements Relatavel {

    private static final Pattern FORMATO_CODIGO = Pattern.compile("^[A-Z0-9][A-Z0-9-]{1,19}$");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(name = "carga_horaria", nullable = false)
    private int cargaHoraria;

    @Column(length = 1000)
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusCurso status = StatusCurso.ATIVO;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected Curso() {
    }

    protected Curso(String codigo, String nome, int cargaHoraria, String descricao) {
        alterarCodigo(codigo);
        atualizarDados(nome, cargaHoraria, descricao);
        this.criadoEm = LocalDateTime.now();
    }

    /** Modalidade concreta do curso. */
    public abstract ModalidadeCurso getModalidade();

    /** Onde as aulas acontecem: sala física ou plataforma virtual. */
    public abstract String getLocalAulas();

    public void alterarCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new RegraNegocioException("O código do curso é obrigatório.");
        }
        String normalizado = codigo.trim().toUpperCase();
        if (!FORMATO_CODIGO.matcher(normalizado).matches()) {
            throw new RegraNegocioException(
                    "Código do curso inválido: use de 2 a 20 letras maiúsculas, números ou hífen.");
        }
        this.codigo = normalizado;
    }

    public void atualizarDados(String nome, int cargaHoraria, String descricao) {
        if (nome == null || nome.isBlank()) {
            throw new RegraNegocioException("O nome do curso é obrigatório.");
        }
        if (cargaHoraria <= 0) {
            throw new RegraNegocioException("A carga horária deve ser maior que zero.");
        }
        this.nome = nome.trim();
        this.cargaHoraria = cargaHoraria;
        this.descricao = descricao == null || descricao.isBlank() ? null : descricao.trim();
    }

    public void ativar() {
        this.status = StatusCurso.ATIVO;
    }

    public void inativar() {
        this.status = StatusCurso.INATIVO;
    }

    public boolean isAtivo() {
        return status == StatusCurso.ATIVO;
    }

    /** Colunas comuns a todos os cursos; as subclasses acrescentam as suas. */
    @Override
    public LinkedHashMap<String, Object> gerarRelatorio() {
        LinkedHashMap<String, Object> linha = new LinkedHashMap<>();
        linha.put("Código", codigo);
        linha.put("Nome", nome);
        linha.put("Modalidade", getModalidade() == ModalidadeCurso.EAD ? "EAD" : "Presencial");
        linha.put("Carga horária (h)", cargaHoraria);
        linha.put("Status", isAtivo() ? "Ativo" : "Inativo");
        return linha;
    }

    public Long getId() {
        return id;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getNome() {
        return nome;
    }

    public int getCargaHoraria() {
        return cargaHoraria;
    }

    public String getDescricao() {
        return descricao;
    }

    public StatusCurso getStatus() {
        return status;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Curso outro)) return false;
        return id != null && id.equals(outro.getId());
    }

    @Override
    public int hashCode() {
        return Curso.class.hashCode();
    }
}
