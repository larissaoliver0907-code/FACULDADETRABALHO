package com.educonnect.repository;

import com.educonnect.model.Perfil;
import com.educonnect.model.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByLogin(String login);

    boolean existsByLogin(String login);

    boolean existsByLoginAndIdNot(String login, Long id);

    long countByPerfilAndAtivoTrue(Perfil perfil);

    @Query("""
            select u from Usuario u
            where (lower(u.nome) like :padrao or lower(u.login) like :padrao)
            """)
    Page<Usuario> pesquisar(@Param("padrao") String padrao, Pageable pageable);
}
