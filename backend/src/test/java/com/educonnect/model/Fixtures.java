package com.educonnect.model;

import java.util.Set;

/** Objetos de domínio para testes unitários (sem banco de dados). */
public final class Fixtures {

    public static final String HASH = "$2a$04$hashficticioparatestes.................................";

    private Fixtures() {
    }

    public static CursoPresencial cursoPresencial() {
        return new CursoPresencial("ADS", "Análise e Desenvolvimento de Sistemas", 2400, "Descrição", "B-204");
    }

    public static CursoEAD cursoEad() {
        return new CursoEAD("GTI", "Gestão de TI", 1600, null, "Moodle");
    }

    public static Aluno aluno(String matricula, Curso curso) {
        return new Aluno("Aluno " + matricula, "login" + matricula.toLowerCase(), HASH, matricula, curso);
    }

    public static Professor professorDo(Curso curso) {
        Professor p = new Professor("Professora Teste", "prof.teste", HASH, "P001", "Software");
        p.definirCursos(Set.of(curso));
        return p;
    }
}
