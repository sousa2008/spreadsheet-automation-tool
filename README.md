# Sistema LUPEON - Automação e Gestão de Transportes

Sistema interno desenvolvido para otimizar o fluxo operacional de arquivos, coletas e auditorias na **MA2 Transportes**, criado no contexto de melhoria contínua de processos durante atividades de estágio.

## 💡 Sobre o Projeto

A ferramenta nasceu de uma necessidade prática do dia a dia corporativo: eliminar gargalos manuais e lentidões associadas a planilhas estáticas tradicionais. O objetivo não foi reestruturar a operação global da empresa, mas sim aplicar engenharia de software leve para resolver uma dor real de produtividade, unindo automação, tratamento de dados em memória e interfaces amigáveis integradas ao Google Workspace.

## 🤖 Desenvolvimento e Abordagem

O projeto foi construído utilizando conceitos modernos de desenvolvimento ágil e prototipagem rápida orientada a IA ("vibe coding"), atuando em parceria com inteligência artificial para estruturar a arquitetura lógica, depurar código e refatorar módulos. A ideia central foi ir muito além de "copiar scripts", focando na compreensão profunda de algoritmos, estruturas de dados e boas práticas de engenharia aplicadas a cenários reais de negócio.

## 🚀 Principais Funcionalidades

* **Importador em Massa via Modal HTML:** Interface customizada (`index.html`) que permite colar blocos de dados tabulares externos, processando matrizes complexas em lote no back-end.
* **Validação Anti-Duplicidade em O(1):** Utilização de objetos `Set` para indexação e varredura instantânea de Notas Fiscais existentes, impedindo registros duplicados na base de dados.
* **Busca Reativa Dinâmica:** Substituição de fórmulas lentas de planilhas por um motor de busca em memória acionado por gatilhos de edição (`onEdit`), permitindo filtrar por DT ou NF instantaneamente ao pressionar Enter.
* **Auditoria Funcional de Pendências:** Encadeamento de métodos de alta performance (`.filter()` e `.map()`) para rastrear documentos sem status de upload e gerar alertas automatizados.
* **Conexão com SUPABASE na nuvem** agrupamento das funções de pesquisa e consulta através do painel da supabase.

## 🛠️ Tecnologias Utilizadas

* **Google Apps Script** (Lógica de Servidor / Back-end)
* **JavaScript Moderno** (Manipulação de Arrays, Objetos e Programação Funcional)
* **Google Sheets API** (Camada de Persistência de Dados)
* **HTML5 / CSS3** (Interface de Front-end para os modais de importação)
* **Supabase / PostegreSQL** (Conexão e gerenciamento de=o banco de dados na nuvem)
* * **TypeScript** (Integração juntamente ao Apps Script na criação do Back-end via clasp)

---

*Projeto mantido para fins de portfólio acadêmico e profissional, demonstrando iniciativa na resolução de problemas corporativos através de programação.*
