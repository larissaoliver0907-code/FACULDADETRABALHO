package com.educonnect.config;

import com.educonnect.model.Aluno;
import com.educonnect.model.Avaliacao;
import com.educonnect.model.Curso;
import com.educonnect.model.CursoEAD;
import com.educonnect.model.CursoPresencial;
import com.educonnect.model.Professor;
import com.educonnect.model.Turma;
import com.educonnect.repository.AlunoRepository;
import com.educonnect.repository.AvaliacaoRepository;
import com.educonnect.repository.CursoRepository;
import com.educonnect.repository.ProfessorRepository;
import com.educonnect.repository.TurmaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * Dados de demonstração para desenvolvimento local (perfil "demo").
 * Todos os registros são identificados com "[Exemplo]" e só são criados se não houver cursos.
 * As contas de exemplo usam a senha definida em DEMO_PASSWORD (obrigatória para este perfil).
 */
@Component
@Order(2)
@ConditionalOnProperty(name = "educonnect.demo.enabled", havingValue = "true")
public class DadosDemonstracao implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DadosDemonstracao.class);

    private final CursoRepository cursos;
    private final ProfessorRepository professores;
    private final AlunoRepository alunos;
    private final TurmaRepository turmas;
    private final AvaliacaoRepository avaliacoes;
    private final PasswordEncoder encoder;
    private final String senhaDemo;

    public DadosDemonstracao(CursoRepository cursos, ProfessorRepository professores, AlunoRepository alunos,
                             TurmaRepository turmas, AvaliacaoRepository avaliacoes, PasswordEncoder encoder,
                             @Value("${DEMO_PASSWORD:}") String senhaDemo) {
        this.cursos = cursos;
        this.professores = professores;
        this.alunos = alunos;
        this.turmas = turmas;
        this.avaliacoes = avaliacoes;
        this.encoder = encoder;
        this.senhaDemo = senhaDemo;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (cursos.count() > 0) {
            return;
        }
        if (senhaDemo == null || senhaDemo.length() < 8) {
            log.warn("Perfil demo ativo, mas DEMO_PASSWORD não foi definida (mínimo 8 caracteres). Dados de exemplo não criados.");
            return;
        }
        String hash = encoder.encode(senhaDemo);

        Curso ads = cursos.save(new CursoPresencial("EX-ADS", "[Exemplo] Análise e Desenvolvimento de Sistemas", 2400,
                "Curso de exemplo para demonstração.", "B-204"));
        Curso gti = cursos.save(new CursoEAD("EX-GTI", "[Exemplo] Gestão da Tecnologia da Informação", 1600,
                "Curso de exemplo para demonstração.", "Moodle"));

        Professor p1 = new Professor("[Exemplo] Professora Ana Lima", "ana.lima", hash, "EX-P001", "Engenharia de Software");
        p1.definirCursos(Set.of(ads));
        p1 = professores.save(p1);
        Professor p2 = new Professor("[Exemplo] Professor Bruno Reis", "ex.bruno", hash, "EX-P002", "Redes e Infraestrutura");
        p2.definirCursos(Set.of(gti, ads));
        p2 = professores.save(p2);

        Turma t1 = new Turma("EX-ADS-2026A", ads, 30);
        t1.associarProfessor(p1);
        t1 = turmas.save(t1);
        Turma t2 = new Turma("EX-GTI-2026A", gti, 40);
        t2.associarProfessor(p2);
        t2 = turmas.save(t2);

        String[][] dadosAlunos = {
                {"[Exemplo] Carla Souza", "carla.souza", "EX0001"},
                {"[Exemplo] Diego Martins", "ex.diego", "EX0002"},
                {"[Exemplo] Elisa Ramos", "ex.elisa", "EX0003"},
                {"[Exemplo] Felipe Costa", "ex.felipe", "EX0004"},
        };
        double[][] notas = {{8.5, 9.0}, {6.0, 5.5}, {4.0, 6.5}, {9.5, 10.0}};
        LocalDate hoje = LocalDate.now();
        for (int i = 0; i < dadosAlunos.length; i++) {
            Curso curso = i % 2 == 0 ? ads : gti;
            Turma turma = i % 2 == 0 ? t1 : t2;
            Aluno aluno = alunos.save(new Aluno(dadosAlunos[i][0], dadosAlunos[i][1], hash, dadosAlunos[i][2], curso));
            turma.adicionarAluno(aluno);
            List<String> descricoes = List.of("Prova 1", "Trabalho prático");
            for (int j = 0; j < notas[i].length; j++) {
                avaliacoes.save(new Avaliacao(aluno, turma, descricoes.get(j),
                        BigDecimal.valueOf(notas[i][j]), hoje.minusDays(20L - j * 10L)));
            }
        }
        log.info("Dados de demonstração criados (identificados como [Exemplo]).");
    }
}
