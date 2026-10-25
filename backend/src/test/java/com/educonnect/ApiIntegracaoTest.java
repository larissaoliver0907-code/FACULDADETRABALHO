package com.educonnect;

import com.educonnect.model.Administrador;
import com.educonnect.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de ponta a ponta da API com banco H2 (migrações Flyway reais), autenticação JWT
 * e autorização por perfil.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiIntegracaoTest {

    private static final String SENHA = "SenhaForte1";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired UsuarioRepository usuarios;
    @Autowired PasswordEncoder encoder;

    private String tokenAdmin;

    @BeforeEach
    void prepararBanco() throws Exception {
        for (String tabela : new String[]{"avaliacoes", "turma_alunos", "turmas", "professor_cursos", "alunos",
                "professores", "administradores", "usuarios", "cursos", "atividades"}) {
            jdbc.update("DELETE FROM " + tabela);
        }
        jdbc.update("UPDATE configuracao_academica SET media_minima_aprovacao = NULL, media_minima_recuperacao = NULL, quantidade_minima_avaliacoes = 1");
        usuarios.save(new Administrador("Admin Teste", "admin", encoder.encode(SENHA)));
        tokenAdmin = login("admin", SENHA);
    }

    // ------------------------------------------------------------------ utilitários

    private String login(String login, String senha) throws Exception {
        String corpo = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("login", login, "senha", senha))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(corpo).get("token").asText();
    }

    private ResultActions enviar(String metodo, String url, String token, Object corpo) throws Exception {
        var req = switch (metodo) {
            case "POST" -> post(url);
            case "PUT" -> put(url);
            case "DELETE" -> delete(url);
            default -> get(url);
        };
        if (token != null) req.header("Authorization", "Bearer " + token);
        if (corpo != null) req.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo));
        return mvc.perform(req);
    }

    private JsonNode corpo(ResultActions r) throws Exception {
        return json.readTree(r.andReturn().getResponse().getContentAsString());
    }

    private long criarCurso(String codigo) throws Exception {
        return corpo(enviar("POST", "/api/cursos", tokenAdmin, Map.of("codigo", codigo, "nome", "Curso " + codigo,
                "cargaHoraria", 1200, "modalidade", "PRESENCIAL", "sala", "A-1"))
                .andExpect(status().isCreated())).get("id").asLong();
    }

    private long criarAluno(String matricula, long cursoId) throws Exception {
        return corpo(enviar("POST", "/api/alunos", tokenAdmin, Map.of("nome", "Aluno " + matricula,
                "matricula", matricula, "cursoId", cursoId, "login", "al" + matricula.toLowerCase(), "senha", SENHA))
                .andExpect(status().isCreated())).get("id").asLong();
    }

    // ------------------------------------------------------------------ autenticação

    @Test
    @DisplayName("Autenticação: login válido emite token; credenciais inválidas e ausência de token são recusadas")
    void autenticacao() throws Exception {
        enviar("GET", "/api/auth/me", tokenAdmin, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.perfil").value("ADMINISTRADOR"))
                .andExpect(jsonPath("$.senhaHash").doesNotExist());

        enviar("POST", "/api/auth/login", null, Map.of("login", "admin", "senha", "errada123"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("Login ou senha inválidos."));

        enviar("GET", "/api/alunos", null, null).andExpect(status().isUnauthorized());
        enviar("GET", "/api/alunos", "token.invalido.aqui", null).andExpect(status().isUnauthorized());

        String hash = jdbc.queryForObject("SELECT senha_hash FROM usuarios WHERE login = 'admin'", String.class);
        assertThat(hash).startsWith("$2").isNotEqualTo(SENHA);
    }

    @Test
    @DisplayName("Autorização: aluno não acessa cadastros; professor só vê as próprias turmas")
    void autorizacaoPorPerfil() throws Exception {
        long curso = criarCurso("ADS");
        long alunoId = criarAluno("A0001", curso);
        String tokenAluno = login("ala0001", SENHA);

        enviar("GET", "/api/alunos", tokenAluno, null).andExpect(status().isForbidden());
        enviar("GET", "/api/relatorios/alunos", tokenAluno, null).andExpect(status().isForbidden());
        enviar("GET", "/api/me", tokenAluno, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(alunoId));
        enviar("GET", "/api/me", tokenAdmin, null).andExpect(status().isForbidden());

        // Dois professores, cada um com a sua turma.
        long p1 = corpo(enviar("POST", "/api/professores", tokenAdmin, Map.of("nome", "Prof Um", "registro", "R1",
                "especialidade", "BD", "login", "prof1", "senha", SENHA, "cursoIds", new long[]{curso}))
                .andExpect(status().isCreated())).get("id").asLong();
        long p2 = corpo(enviar("POST", "/api/professores", tokenAdmin, Map.of("nome", "Prof Dois", "registro", "R2",
                "especialidade", "Redes", "login", "prof2", "senha", SENHA, "cursoIds", new long[]{curso}))
                .andExpect(status().isCreated())).get("id").asLong();
        long turma1 = corpo(enviar("POST", "/api/turmas", tokenAdmin, Map.of("codigo", "T1", "cursoId", curso,
                "professorId", p1, "capacidadeMaxima", 10))).get("id").asLong();
        long turma2 = corpo(enviar("POST", "/api/turmas", tokenAdmin, Map.of("codigo", "T2", "cursoId", curso,
                "professorId", p2, "capacidadeMaxima", 10))).get("id").asLong();
        enviar("POST", "/api/turmas/" + turma2 + "/alunos", tokenAdmin, Map.of("alunoId", alunoId)).andExpect(status().isOk());

        String tokenProf1 = login("prof1", SENHA);
        enviar("GET", "/api/turmas", tokenProf1, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1))
                .andExpect(jsonPath("$.conteudo[0].id").value(turma1));
        enviar("GET", "/api/turmas/" + turma2, tokenProf1, null).andExpect(status().isForbidden());
        enviar("POST", "/api/avaliacoes", tokenProf1, Map.of("alunoId", alunoId, "turmaId", turma2,
                "descricao", "Prova", "nota", 8, "data", LocalDate.now().toString()))
                .andExpect(status().isForbidden());
        enviar("POST", "/api/cursos", tokenProf1, Map.of("codigo", "X1", "nome", "X", "cargaHoraria", 10,
                "modalidade", "EAD", "plataforma", "Moodle")).andExpect(status().isForbidden());

        // Conta desativada perde o acesso imediatamente, mesmo com token emitido.
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/api/alunos/" + alunoId + "/ativo").param("valor", "false")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk());
        enviar("GET", "/api/me", tokenAluno, null).andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------------ cadastros e regras

    @Test
    @DisplayName("Cadastro de aluno: dados inválidos retornam 400 com os campos; matrícula duplicada retorna 409")
    void cadastroDeAluno() throws Exception {
        long curso = criarCurso("ADS");

        enviar("POST", "/api/alunos", tokenAdmin, Map.of("nome", "", "matricula", "!!", "cursoId", curso,
                "login", "x", "senha", "123"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.matricula").exists())
                .andExpect(jsonPath("$.campos.login").exists())
                .andExpect(jsonPath("$.campos.senha").exists());

        criarAluno("A0001", curso);
        enviar("POST", "/api/alunos", tokenAdmin, Map.of("nome", "Outro", "matricula", "a0001", "cursoId", curso,
                "login", "outro", "senha", SENHA))
                .andExpect(status().isConflict());

        enviar("GET", "/api/alunos?q=a0001", tokenAdmin, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1))
                .andExpect(jsonPath("$.conteudo[0].matricula").value("A0001"));
    }

    @Test
    @DisplayName("Fluxo acadêmico: matrícula, bloqueios, notas, médias, situação e relatórios")
    void fluxoAcademico() throws Exception {
        long curso = criarCurso("ADS");
        long a1 = criarAluno("A0001", curso);
        long a2 = criarAluno("A0002", curso);
        long turma = corpo(enviar("POST", "/api/turmas", tokenAdmin,
                Map.of("codigo", "ADS-1", "cursoId", curso, "capacidadeMaxima", 1))
                .andExpect(status().isCreated())).get("id").asLong();

        enviar("POST", "/api/turmas/" + turma + "/alunos", tokenAdmin, Map.of("alunoId", a1))
                .andExpect(status().isOk()).andExpect(jsonPath("$.matriculados").value(1));
        enviar("POST", "/api/turmas/" + turma + "/alunos", tokenAdmin, Map.of("alunoId", a1))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("já está matriculado")));
        enviar("POST", "/api/turmas/" + turma + "/alunos", tokenAdmin, Map.of("alunoId", a2))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("lotada")));

        String hoje = LocalDate.now().toString();
        enviar("POST", "/api/avaliacoes", tokenAdmin, Map.of("alunoId", a1, "turmaId", turma,
                "descricao", "Prova", "nota", 11, "data", hoje))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.campos.nota").exists());
        enviar("POST", "/api/avaliacoes", tokenAdmin, Map.of("alunoId", a1, "turmaId", turma,
                "descricao", "Prova", "nota", -1, "data", hoje))
                .andExpect(status().isBadRequest());
        enviar("POST", "/api/avaliacoes", tokenAdmin, Map.of("alunoId", a1, "turmaId", turma,
                "descricao", "Prova 1", "nota", 8, "data", hoje)).andExpect(status().isCreated());
        enviar("POST", "/api/avaliacoes", tokenAdmin, Map.of("alunoId", a1, "turmaId", turma,
                "descricao", "Prova 2", "nota", 5, "data", hoje)).andExpect(status().isCreated());

        // Sem critério configurado, o sistema não presume aprovação.
        enviar("GET", "/api/alunos/" + a1 + "/desempenho", tokenAdmin, null)
                .andExpect(jsonPath("$.mediaGeral").value(6.5))
                .andExpect(jsonPath("$.turmas[0].situacao").value("CRITERIO_NAO_CONFIGURADO"));

        enviar("PUT", "/api/configuracoes", tokenAdmin, Map.of("mediaMinimaAprovacao", 6,
                "quantidadeMinimaAvaliacoes", 2)).andExpect(status().isOk());
        enviar("GET", "/api/alunos/" + a1 + "/desempenho", tokenAdmin, null)
                .andExpect(jsonPath("$.turmas[0].media").value(6.5))
                .andExpect(jsonPath("$.turmas[0].situacao").value("APROVADO"));

        // Remover o aluno da turma preserva o histórico de avaliações.
        enviar("DELETE", "/api/turmas/" + turma + "/alunos/" + a1, tokenAdmin, null).andExpect(status().isOk());
        enviar("GET", "/api/alunos/" + a1 + "/avaliacoes", tokenAdmin, null)
                .andExpect(jsonPath("$.length()").value(2));

        enviar("GET", "/api/dashboard", tokenAdmin, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAlunos").value(2))
                .andExpect(jsonPath("$.totalTurmas").value(1))
                .andExpect(jsonPath("$.mediaGeral").value(6.5));

        enviar("GET", "/api/relatorios/notas?turmaId=" + turma, tokenAdmin, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.linhas.length()").value(2))
                .andExpect(jsonPath("$.resumo['Média']").value(6.5));
        enviar("GET", "/api/relatorios/desempenho", tokenAdmin, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.linhas[0]['Situação']").value("Aprovado"));
        enviar("GET", "/api/relatorios/alunos/csv", tokenAdmin, null).andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("relatorio-alunos.csv")));
        enviar("GET", "/api/relatorios/turmas/pdf", tokenAdmin, null).andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"));
    }
}
