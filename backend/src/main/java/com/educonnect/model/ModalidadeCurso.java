package com.educonnect.model;

/** Modalidade do curso; o valor é gravado como discriminador da herança em {@code cursos.tipo}. */
public enum ModalidadeCurso {
    PRESENCIAL,
    EAD;

    public static final String VALOR_PRESENCIAL = "PRESENCIAL";
    public static final String VALOR_EAD = "EAD";
}
