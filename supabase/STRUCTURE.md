# Manutenção e Sincronização (Apps Script + Supabase)

Este repositório reúne o código do **Google Apps Script** (na raiz `/`) e a estrutura do banco de dados **PostgreSQL / Supabase** (na pasta `supabase/`).

---

## 1. Estrutura do Repositório

* **Raiz (`/`):** Arquivos `.gs`, `.html` e `appsscript.json` gerenciados pela extensão do Chrome.
* **Pasta `supabase/`:** Arquivos de configuração e histórico de alterações do banco de dados (`migrations/*.sql`).

---

## 2. Como atualizar o Google Apps Script

As alterações nos scripts e telas HTML são feitas diretamente pelo navegador:

1. Abra o editor do **Google Apps Script**.
2. Faça as alterações necessárias no código.
3. Clique no ícone de **Push** (seta para cima) da extensão *Google Apps Script GitHub Assistant* na barra superior.
4. Insira uma mensagem de commit e confirme.

> **Nota sobre Token Expirado:** Se os botões da extensão pararem de responder:
> 1. Acesse `chrome://extensions/`, abra os detalhes da extensão e clique em **Opções da extensão** > **LOGOUT**.
> 2. No GitHub, vá em **Settings > Developer settings > Personal access tokens > Tokens (classic)** e gere um novo token marcando a permissão `repo`.
> 3. Cole o novo token nas opções da extensão e recarregue a página do Apps Script.

---

## 3. Como atualizar o Banco de Dados (Supabase)

A integração oficial do Supabase observa a branch `main`. Sempre que um novo arquivo `.sql` for enviado para `supabase/migrations/` na branch `main`, o Supabase aplica as mudanças automaticamente em produção.

### Criando uma nova alteração (Migration)
1. Dentro da pasta `supabase/migrations/`, crie um novo arquivo `.sql` seguindo o padrão de data/hora no nome:
   * Exemplo: `20261116120000_adiciona_coluna_status.sql`
2. Escreva os comandos SQL dentro do arquivo (ex: `ALTER TABLE ...` ou `CREATE TABLE ...`).
3. Envie o arquivo para o GitHub via terminal:

```bash
git add .
git commit -m "db: adiciona coluna status"
git push origin main
```

---

## 4. Comandos Úteis da Supabase CLI

Caso precise vincular o projeto novamente em outro computador:

* **Fazer login na conta Supabase:**
  ```bash
  supabase login
  ```

* **Vincular a pasta local ao projeto remoto:**
  ```bash
  supabase link --project-ref ntegpwibjtoamwajlwxk
  ```

* **Baixar estrutura atual (Requer Docker instalado):**
  ```bash
  supabase db pull --remote
  ```

---

## 5. Segurança e Credenciais

* **Nunca** salve chaves de API (`SUPABASE_KEY` ou senhas do banco) diretamente nos arquivos deste repositório.
* As credenciais utilizadas pelo Apps Script ficam armazenadas de forma segura em **Configurações do Projeto > Propriedades do script** (`PropertiesService`).
