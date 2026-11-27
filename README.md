# Sistema LUPEON — Automação e Gestão de Transportes

Sistema interno desenvolvido para otimizar o fluxo operacional de arquivos, coletas, auditorias e indicadores de SLA na **MA2 Transportes**, criado no contexto de melhoria contínua de processos durante atividades de estágio.

## 💡 Sobre o Projeto

A ferramenta nasceu de uma necessidade prática do dia a dia corporativo: eliminar gargalos manuais e lentidões associadas a planilhas estáticas tradicionais. O sistema adota uma **arquitetura híbrida** que une a agilidade de entrada de dados no Google Workspace com a robustez de um banco relacional em nuvem e um painel web analítico dedicado, aplicando engenharia de software leve para resolver dores reais da operação logística.

## 🤖 Desenvolvimento e Abordagem

O projeto foi construído utilizando conceitos modernos de desenvolvimento ágil e prototipagem rápida orientada a IA (*vibe coding*), atuando em parceria com inteligência artificial para estruturar a arquitetura lógica, depurar código e refatorar módulos. A ideia central foi ir muito além de "copiar scripts", focando na compreensão linha a linha de algoritmos, estruturas de dados, integração via APIs REST e boas práticas de segurança aplicadas a cenários reais de negócio.

## 🚀 Principais Funcionalidades

### Camada Operacional (Google Sheets & Apps Script)
* **Importador em Massa via Modais Customizados:** Interfaces em tema escuro (`exp.html`, `index.html`, `extra.html`) que permitem colar blocos tabulares da aba de coletas e processar fretes e extra-fretes em lote no back-end.
* **Validação Anti-Duplicidade em $O(1)$:** Utilização de objetos `Set` e expressões regulares para higienização e varredura instantânea de Notas Fiscais existentes, impedindo registros duplicados na base.
* **Busca Reativa Dinâmica:** Motor de busca em memória acionado por gatilhos de edição (`onEdit`) e modal interativo (`pesquisa.html`), permitindo localizar registros por DT ou NF instantaneamente.
* **Sincronização em Nuvem com Supabase:** Integração via API REST (`UrlFetchApp`) com tratamento de exceções e operação de *upsert* (`on_conflict`), mantendo a planilha e o banco PostgreSQL espelhados.

### Camada Analítica & Gestão (Painel Web PHP)
* **Dashboard de Consulta Paginada (`index.php`):** Painel web responsivo conectado ao Supabase via cliente HTTP próprio (`SupabaseClient.php` com `cURL`), oferecendo filtros rápidos por DT, NF, evento e status.
* **Auditoria de Pendências (`auditoria.php`):** Rastreamento automático de notas fiscais pendentes de upload, calculando dias de espera via `DateTimeImmutable` e classificando gargalos por criticidade (**Atenção** $\ge$ 15 dias e **Crítico** $\ge$ 30 dias).
* **Análise de SLA por Evento (`sla.php`):** Paginação em lotes (`buscarTodos`) para consolidação de métricas históricas de desempenho, exibindo volume concluído, tempo médio, menor e maior prazo entre coleta e upload por tipo de operação.
* **Autenticação e Segurança:** Proteção de acesso via sessões PHP (`$_SESSION`), validação segura com `hash_equals` e gerenciamento de credenciais por variáveis de ambiente.

## 🏗️ Estrutura do Repositório

```text
spreadsheet-automation-tool/
├── apps-script/      # Scripts (.gs / .ts) e interfaces modais (.html) da planilha
├── web/              # Painel analítico em PHP 8.2 (Auditoria, SLA, Autenticação e REST Client)
├── supabase/         # Estrutura e definições do banco de dados PostgreSQL
├── docs/             # Documentação técnica e manuais de integração (n8n)
└── Dockerfile        # Configuração de container Apache/PHP para deploy contínuo no Render

```

## 🛠️ Tecnologias Utilizadas

* **Google Apps Script & TypeScript** (Back-end operacional da planilha via clasp)

* **JavaScript Moderno** (Manipulação de matrizes, objetos Set e programação funcional)

* **PHP 8.2** (Painel web analítico, consumo de API REST via cURL, DateTimeImmutable e controle de sessão)

* **HTML5 / CSS3** (Interfaces dark-mode responsivas para modais e dashboard gerencial)

* **Supabase / PostgreSQL** (Banco de dados relacional em nuvem e API REST)

* **Docker & Render** (Containerização e hospedagem com deploy automático via GitHub)

* **n8n** (Automações complementares e fluxos via webhook)

---

Projeto mantido para fins de portfólio acadêmico e profissional, demonstrando iniciativa na resolução de problemas corporativos através de engenharia de software.