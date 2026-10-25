package com.educonnect.didatico;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;

/**
 * VERSÃO DIDÁTICA — armazenamento temporário em lista ({@link ArrayList}).
 * <p>
 * Representa a fase acadêmica do projeto, antes do banco de dados. Os dados são perdidos ao
 * encerrar o programa. A aplicação de produção usa os repositórios JPA do pacote
 * {@code com.educonnect.repository}; esta classe não é usada pela API.
 */
public class RepositorioEmMemoria<T> {

    private final List<T> itens = new ArrayList<>();

    public void adicionar(T item) {
        if (item == null) {
            throw new IllegalArgumentException("Não é possível adicionar um item nulo.");
        }
        itens.add(item);
    }

    public boolean remover(T item) {
        return itens.remove(item);
    }

    /** Busca linear com laço for-each, como no exercício acadêmico. */
    public Optional<T> buscarPrimeiro(Predicate<T> criterio) {
        for (T item : itens) {
            if (criterio.test(item)) {
                return Optional.of(item);
            }
        }
        return Optional.empty();
    }

    public List<T> filtrar(Predicate<T> criterio) {
        List<T> resultado = new ArrayList<>();
        for (T item : itens) {
            if (criterio.test(item)) {
                resultado.add(item);
            }
        }
        return resultado;
    }

    public List<T> listar() {
        return Collections.unmodifiableList(itens);
    }

    public int quantidade() {
        return itens.size();
    }
}
