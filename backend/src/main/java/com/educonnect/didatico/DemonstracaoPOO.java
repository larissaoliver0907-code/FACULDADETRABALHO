package com.educonnect.didatico;

import com.educonnect.exception.RegraNegocioException;
import com.educonnect.model.Aluno;
import com.educonnect.model.Avaliacao;
import com.educonnect.model.ConfiguracaoAcademica;
import com.educonnect.model.Curso;
import com.educonnect.model.CursoEAD;
import com.educonnect.model.CursoPresencial;
import com.educonnect.model.Professor;
import com.educonnect.model.Relatavel;
import com.educonnect.model.Turma;
import com.educonnect.model.Usuario;
import com.educonnect.security.Autenticacao;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * VERSÃO DIDÁTICA executável no terminal, sem banco de dados.
 * <p>
 * Demonstra, com as mesmas classes de domínio da aplicação: classes e objetos, encapsulamento,
 * herança (Curso → CursoPresencial/CursoEAD; Usuario → Aluno/Professor), polimorfismo
 * ({@code gerarRelatorio()}), abstração, interfaces ({@link Autenticacao}, {@link Relatavel}),
 * composição (Turma contém alunos), coleções e laços, tratamento de exceções e validação.
 * <p>
 * Executar: {@code mvn -q compile exec:java -Dexec.mainClass=com.educonnect.didatico.DemonstracaoPOO}
 * ou pela IDE. Os dados são fictícios e marcados como exemplo.
 */
public final class DemonstracaoPOO {

    private DemonstracaoPOO() {
    }

    public static void main(String[] args) {
        PasswordEncoder encoder = new BCryptPasswordEncoder(4); // custo baixo apenas para a demonstração
        RepositorioEmMemoria<Curso> cursos = new RepositorioEmMemoria<>();
        RepositorioEmMemoria<Usuario> usuarios = new RepositorioEmMemoria<>();
        RepositorioEmMemoria<Turma> turmas = new RepositorioEmMemoria<>();
        RepositorioEmMemoria<Avaliacao> avaliacoes = new RepositorioEmMemoria<>();

        // Herança: dois tipos concretos de Curso.
        Curso presencial = new CursoPresencial("DEMO-ADS", "Exemplo: Análise de Sistemas", 2400, null, "B-101");
        Curso ead = new CursoEAD("DEMO-GTI", "Exemplo: Gestão de TI", 1600, null, "Moodle");
        cursos.adicionar(presencial);
        cursos.adicionar(ead);

        Professor professor = new Professor("Exemplo: Prof. Ana", "demo.ana", encoder.encode("senhaDemo1"),
                "DEMO-P1", "Engenharia de Software");
        professor.definirCursos(Set.of(presencial));
        usuarios.adicionar(professor);

        Turma turma = new Turma("DEMO-T1", presencial, 2);
        turma.associarProfessor(professor);
        turmas.adicionar(turma);

        // Coleções e laços: cadastro de alunos a partir de uma matriz.
        String[][] dados = {{"Exemplo: Carla", "demo.carla", "DEMO0001"},
                {"Exemplo: Diego", "demo.diego", "DEMO0002"},
                {"Exemplo: Elisa", "demo.elisa", "DEMO0003"}};
        List<Aluno> novos = new ArrayList<>();
        for (String[] d : dados) {
            Aluno aluno = new Aluno(d[0], d[1], encoder.encode("senhaDemo1"), d[2], presencial);
            usuarios.adicionar(aluno);
            novos.add(aluno);
        }

        // Tratamento de exceções: a terceira matrícula excede a capacidade da turma.
        for (Aluno aluno : novos) {
            try {
                turma.adicionarAluno(aluno);
                System.out.println("Matriculado: " + aluno.getNome());
            } catch (RegraNegocioException e) {
                System.out.println("Matrícula recusada: " + e.getMessage());
            }
        }

        // Encapsulamento: a nota só muda via atribuirNota(), que valida o intervalo.
        Avaliacao prova = new Avaliacao(novos.get(0), turma, "Prova 1", new BigDecimal("8.5"), LocalDate.now());
        avaliacoes.adicionar(prova);
        avaliacoes.adicionar(new Avaliacao(novos.get(0), turma, "Trabalho", new BigDecimal("7.0"), LocalDate.now()));
        try {
            prova.atribuirNota(11);
        } catch (RegraNegocioException e) {
            System.out.println("Nota recusada: " + e.getMessage());
        }

        // Média calculada com laço sobre a coleção.
        List<BigDecimal> notas = new ArrayList<>();
        for (Avaliacao a : avaliacoes.filtrar(a -> a.getAluno() == novos.get(0))) {
            notas.add(a.getNota());
        }
        System.out.println("Média de " + novos.get(0).getNome() + ": " + ConfiguracaoAcademica.calcularMedia(notas));

        // Interface + polimorfismo: autenticação com a implementação em memória.
        Autenticacao autenticacao = new AutenticacaoEmMemoria(usuarios, encoder);
        Usuario logado = autenticacao.autenticar("demo.ana", "senhaDemo1");
        System.out.println("Autenticado: " + logado.getNome() + " (" + logado.getPerfil() + ")");

        // Polimorfismo: cada objeto gera o próprio relatório.
        List<Relatavel> relataveis = new ArrayList<>();
        relataveis.addAll(cursos.listar());
        relataveis.addAll(usuarios.listar());
        relataveis.addAll(turmas.listar());
        System.out.println("\n--- Relatórios (polimorfismo) ---");
        for (Relatavel r : relataveis) {
            System.out.println(r.getClass().getSimpleName() + ": " + r.gerarRelatorio());
        }
        System.out.println("\n" + turma.getResumo());
    }
}
