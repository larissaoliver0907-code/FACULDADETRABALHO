# EduConnect — Sistema de Gestão Educacional

Sistema web para universidades, faculdades e escolas. Ele reúne a gestão de alunos, professores, cursos, turmas, avaliações e relatórios, com autenticação e permissões por perfil.

O backend em Java aplica os princípios de Programação Orientada a Objetos nas próprias regras do domínio, e não em exemplos artificiais. O frontend é uma aplicação React responsiva, com tema claro e escuro.

| Camada | Tecnologias |
|---|---|
| Backend | Java 21, Spring Boot 3.5, Spring Web, Spring Data JPA, Bean Validation, Spring Security (JWT + BCrypt), Flyway |
| Banco | PostgreSQL (produção) · H2 em modo PostgreSQL (testes) |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Lucide, Recharts, React Router |
| Testes | JUnit 5, Mockito, AssertJ, MockMvc |
| Relatórios | CSV (UTF-8, separador `;`) e PDF (OpenPDF) |

---

## Funcionalidades

- **Dashboard.** Mostra os totais de alunos, professores, cursos e turmas, a média geral, as matrículas ativas, gráficos de alunos por curso, a distribuição das notas e a situação acadêmica, as atividades recentes e atalhos. Todos os indicadores são calculados a partir do banco.
- **Alunos.** Cadastro, edição, busca por nome ou matrícula, listagem paginada, detalhes, turmas, histórico de avaliações, média e situação. A desativação preserva o histórico.
- **Professores.** Cadastro, edição, busca por nome, registro ou especialidade, cursos em que leciona e turmas vinculadas.
- **Cursos.** Modalidades `CursoPresencial` (sala) e `CursoEAD` (plataforma), código único, carga horária, status e turmas vinculadas.
- **Turmas.** Curso, professor responsável, capacidade e status. Matrícula e remoção de alunos, com bloqueio de duplicidade, de lotação, de aluno inativo e de aluno de outro curso.
- **Avaliações.** Nota de 0 a 10, com até duas casas decimais, alterada apenas por `atribuirNota()`. Edição conforme as permissões, média por aluno e situação acadêmica.
- **Critérios acadêmicos configuráveis.** O sistema não presume média oficial. Enquanto a instituição não define a média de aprovação, a situação aparece como "Critério não configurado".
- **Relatórios.** Alunos, professores, cursos, turmas e matrículas, notas e médias, e desempenho. Têm filtros por curso, turma e período e exportação em CSV e PDF.
- **Usuários e permissões.** Listagem de contas, criação de administradores, ativação, desativação e redefinição de senha.
- **Área do aluno.** O aluno consulta apenas os próprios dados, notas e situação.

### Permissões

| Recurso | Administrador | Professor | Aluno |
|---|---|---|---|
| Dashboard | ✔ | ✔ | — |
| Alunos, professores, usuários, relatórios | ✔ | — | — |
| Cursos | gerencia | consulta | — |
| Turmas | todas | somente as próprias | — |
| Avaliações | todas (inclui excluir) | lança e edita nas próprias turmas abertas | — |
| Critérios acadêmicos | altera | consulta | — |
| Meus dados e notas (`/api/me`) | — | — | ✔ |

As regras são aplicadas **no servidor**: nas rotas (`SecurityConfig`), nos métodos (`@PreAuthorize`) e nos serviços (por exemplo, um professor só acessa as próprias turmas). O frontend apenas oculta o que o perfil não pode usar.

---

## Arquitetura

```
educonnect/
├── backend/                         API REST Spring Boot
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/educonnect/
│       │   ├── model/               Entidades e regras do domínio (POO)
│       │   ├── repository/          Spring Data JPA + filtros (Especificacoes)
│       │   ├── service/             Regras de negócio e casos de uso
│       │   │   └── relatorio/       Geradores polimórficos + exportação CSV/PDF
│       │   ├── controller/          Endpoints REST
│       │   ├── dto/                 Contratos de entrada/saída com Bean Validation
│       │   ├── config/              Segurança, CORS, administrador inicial, dados demo
│       │   ├── security/            JWT, filtro, interface Autenticacao, limitador de login
│       │   ├── exception/           Exceções de domínio e tratamento padronizado
│       │   └── didatico/            Versão didática com listas em memória
│       ├── main/resources/
│       │   ├── application.yml
│       │   └── db/migration/        Migrações Flyway (esquema do banco)
│       └── test/                    Testes unitários e de integração
├── frontend/                        Aplicação React
│   └── src/
│       ├── pages/                   Páginas (uma por item do menu)
│       ├── components/ui/           Componentes reutilizáveis (botões, campos, tabela, modal…)
│       ├── layouts/                 Layout com sidebar, topbar e navegação por perfil
│       ├── services/                Cliente HTTP e serviços da API
│       ├── contexts/                Autenticação, tema e avisos (toasts)
│       ├── hooks/                   Carregamento de dados e formulários
│       ├── types/                   Tipos TypeScript dos contratos da API
│       └── utils/                   Formatação
├── docker-compose.yml               PostgreSQL para desenvolvimento
└── .env.example
```

### Onde está cada conceito de POO

| Conceito | Onde |
|---|---|
| Classes e objetos | Entidades `Aluno`, `Professor`, `Curso`, `Turma`, `Avaliacao`… |
| Encapsulamento | Atributos privados e sem setters públicos. `Avaliacao.nota` só muda por `atribuirNota()`, que aceita valores de 0 a 10. `Turma.alunos` é exposto como coleção somente leitura |
| Herança | `Usuario` (abstrata) → `Aluno`, `Professor`, `Administrador` (JPA `JOINED`). `Curso` (abstrata) → `CursoPresencial`, `CursoEAD` (JPA `SINGLE_TABLE`) |
| Polimorfismo | `getLocalAulas()` e `gerarRelatorio()` sobrescritos em cada subclasse. `RelatorioService` escolhe o `GeradorRelatorio` pelo tipo, sem `switch` |
| Abstração | Classes abstratas `Usuario`, `Curso`, `RelatorioBase` (método-modelo) |
| Interfaces | `Autenticacao.autenticar(login, senha)` (implementações `AuthService` e `AutenticacaoEmMemoria`), `Relatavel`, `GeradorRelatorio` |
| Composição e associações | `Turma` contém alunos e referencia curso e professor. `Professor` ↔ `Curso`. `Avaliacao` → aluno e turma |
| Coleções e laços | Matrículas (`Set`), agrupamento de notas por turma, cálculo de médias, geração de relatórios |
| Tratamento de exceções | `RegraNegocioException`, `ConflitoException`, `RecursoNaoEncontradoException`, `AcessoNegadoException` → `GlobalExceptionHandler` |
| Validação | Bean Validation nos DTOs e invariantes nos construtores e métodos das entidades |

**Versão didática (listas em memória).** O pacote `com.educonnect.didatico` reproduz a fase acadêmica sem banco de dados, usando as mesmas classes de domínio, `RepositorioEmMemoria<T>` (com `ArrayList` e laços) e `AutenticacaoEmMemoria`. Execute `DemonstracaoPOO` pela IDE. Esse pacote não é usado pela API.

---

## Requisitos

- Java 21 (JDK)
- Maven 3.9+
- Node.js 20+ e npm
- PostgreSQL 14+ (ou Docker para usar o `docker-compose.yml`)

## Configuração

1. Copie o arquivo de exemplo e preencha os valores:
   ```bash
   cp .env.example .env
   ```
   - `JWT_SECRET`: gere com `openssl rand -base64 48`.
   - `DB_PASSWORD`: escolha uma senha forte.
   - `ADMIN_LOGIN` e `ADMIN_PASSWORD`: criam o primeiro administrador quando o banco está vazio. A senha precisa ter 8 ou mais caracteres, com letras e números.

   O backend lê o `.env` automaticamente, tanto na raiz do projeto quanto na pasta `backend`. Variáveis de ambiente do sistema também funcionam e têm prioridade.

2. Suba o banco PostgreSQL:
   ```bash
   docker compose --env-file .env up -d
   ```
   Se preferir usar um PostgreSQL já instalado:
   ```sql
   CREATE USER educonnect WITH PASSWORD 'sua-senha';
   CREATE DATABASE educonnect OWNER educonnect;
   ```
   O esquema é criado pelo Flyway na primeira execução (`backend/src/main/resources/db/migration`).

## Executar o backend

```bash
cd backend
mvn spring-boot:run
```

A API sobe em `http://localhost:8080/api` (há um teste rápido em `GET /api/health`).

**Dados de demonstração (opcional).** Para criar cursos, professores, alunos e notas de exemplo, todos identificados como `[Exemplo]`, defina `DEMO_PASSWORD` no `.env` e execute:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=demo
```

As contas de exemplo (`professor`, `aluno`, `ex.bruno`, `ex.diego`…) usam a senha definida em `DEMO_PASSWORD`. Esses dados só são criados quando o banco não possui cursos. **Não use o perfil `demo` em produção.**

## Executar o frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. Em desenvolvimento, o Vite encaminha `/api` para `http://localhost:8080`.

Com o backend no perfil `demo`, a tela de login mostra as contas `professor` e `aluno` com a senha de exemplo; clique em uma delas para preencher o formulário.

## Executar os testes

```bash
cd backend
mvn test
```

| Classe de teste | Cobre |
|---|---|
| `TurmaTest` | criação de turma; inclusão e remoção de alunos; bloqueio de matrícula duplicada e de turma lotada; associações inconsistentes |
| `AvaliacaoTest` | rejeição de notas menores que 0 ou maiores que 10; encapsulamento da nota |
| `CursoHerancaTest` | herança e polimorfismo de `CursoPresencial` e `CursoEAD` |
| `ConfiguracaoAcademicaTest` | cálculo de médias; situação conforme os critérios configurados |
| `AlunoServiceTest` | cadastro válido e inválido de aluno (Mockito) |
| `ProfessorCursoServiceTest` | cadastro de professor e de curso (Mockito) |
| `RelatorioTest` | geração de relatórios; exportação CSV (com proteção contra injeção de fórmulas) e PDF |
| `ApiIntegracaoTest` | autenticação, autorização por perfil e fluxo completo pela API, com H2 e Flyway |

Para verificar o frontend:

```bash
cd frontend
npm run build
```

---

## Segurança

- Senhas armazenadas apenas como hash **BCrypt** (custo 12). A senha em texto puro nunca chega às entidades nem aos logs.
- **JWT** assinado com HMAC-SHA256, com expiração configurável. Cada requisição confere se a conta continua ativa, então a desativação vale imediatamente.
- Limite de tentativas de login: 5 falhas bloqueiam o login por 15 minutos, com mensagem genérica que não revela se a conta existe.
- Autorização por perfil em rotas, métodos e serviços.
- Consultas parametrizadas via JPA e Criteria API, sem concatenação de SQL.
- Validação no frontend e no backend. Erros seguem um formato padronizado (`status`, `mensagem`, `campos`), sem stack trace.
- Exportação CSV protegida contra injeção de fórmulas (`=`, `+`, `-`, `@`).
- Nenhum segredo no frontend. O token fica em `sessionStorage` e é descartado ao fechar a aba.
- Confirmação obrigatória para ações destrutivas ou que afetam acesso: desativar, remover da turma, excluir avaliação, sair.

## Produção

**Variáveis de ambiente.** Defina `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` e `CORS_ALLOWED_ORIGINS` no ambiente do servidor ou no gerenciador de segredos da hospedagem, nunca no repositório. Depois de criar o primeiro administrador, remova `ADMIN_PASSWORD`.

**Build:**
```bash
cd backend && mvn clean package          # gera target/educonnect-backend-1.0.0.jar
java -jar target/educonnect-backend-1.0.0.jar

cd frontend && VITE_API_URL=https://api.suainstituicao.edu.br/api npm run build   # gera dist/
```

**HTTPS.** Publique a API e o frontend atrás de um proxy reverso (Nginx, Caddy, Traefik ou o balanceador da nuvem) com certificado TLS, por exemplo do Let's Encrypt. Exemplo com Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name app.suainstituicao.edu.br;
    ssl_certificate     /etc/letsencrypt/live/app.suainstituicao.edu.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.suainstituicao.edu.br/privkey.pem;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    root /var/www/educonnect;          # conteúdo de frontend/dist
    location / { try_files $uri /index.html; }
    location /api/ { proxy_pass http://127.0.0.1:8080; proxy_set_header X-Forwarded-Proto https; }
}
server { listen 80; server_name app.suainstituicao.edu.br; return 301 https://$host$request_uri; }
```

Se o frontend e a API ficarem no mesmo domínio, como no exemplo acima, deixe `VITE_API_URL` vazio. Em domínios diferentes, inclua a origem do frontend em `CORS_ALLOWED_ORIGINS`.

**Limitações conhecidas:**
- O limitador de tentativas de login fica em memória. Com várias instâncias da API, troque por um armazenamento compartilhado, como o Redis.
- Os relatórios carregam todos os registros filtrados de uma vez. Para bases muito grandes, considere paginar ou gerar em segundo plano.
