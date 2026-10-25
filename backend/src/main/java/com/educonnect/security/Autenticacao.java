package com.educonnect.security;

import com.educonnect.model.Usuario;

/**
 * Contrato de autenticação do sistema.
 * <p>
 * A implementação de produção ({@link com.educonnect.service.AuthService}) consulta o banco e
 * compara a senha com o hash BCrypt; a versão didática em memória
 * ({@link com.educonnect.didatico.AutenticacaoEmMemoria}) usa listas. Ambas são intercambiáveis
 * por meio desta interface (polimorfismo).
 */
public interface Autenticacao {

    /**
     * Valida as credenciais e devolve o usuário autenticado.
     *
     * @throws org.springframework.security.authentication.BadCredentialsException se login ou senha
     *                                                                              forem inválidos ou a conta estiver inativa.
     */
    Usuario autenticar(String login, String senha);
}
