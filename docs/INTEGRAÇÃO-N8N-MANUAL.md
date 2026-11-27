# Documentação da Integração: Google Sheets + ngrok + n8n Localhost

Este guia documenta toda a arquitetura, configurações, alterações realizadas e procedimentos de manutenção da integração que dispara o fluxo local do **n8n** a partir de um botão no **Google Sheets**.

---

## 1. Visão Geral da Arquitetura

Como o Google Apps Script roda nos servidores em nuvem do Google, ele não consegue acessar diretamente o endereço `localhost:5678` do seu computador. Para resolver isso, criamos uma ponte segura e permanente:

```text
[Botão no Google Sheets] 
       │  (Requisição POST via Apps Script)
       ▼
[Domínio Fixo ngrok] ──► https://justly-obsession-parched.ngrok-free.dev
       │  (Túnel rodando em segundo plano como Serviço do Windows)
       ▼
[n8n Localhost] ───────► http://localhost:5678/webhook/656d750b-f027-4ab6-85cd-bfd2a2282013
       │  (Processa os dados, gera os CSVs e conta os registros)
       ▼
[Respond to Webhook] ──► Devolve o resumo em JSON para o alerta na planilha
```

---

## 2. O Que Foi Alterado no Fluxo do n8n

Para sair do gatilho manual e permitir o disparo externo com retorno visual na planilha, fizemos as seguintes modificações no fluxo (`LUPEON CSV`):

1. **Troca de Gatilho (`Manual Trigger` ➔ `Webhook`):**
   * Método configurado: `POST`.
   * Caminho (Path): `656d750b-f027-4ab6-85cd-bfd2a2282013`.
   * Modo de resposta (**Respond**): `Using 'Respond to Webhook' Node` (faz o Google Sheets aguardar o processamento terminar antes de exibir o pop-up).

2. **Ramo de Contagem e Resumo (4ª saída do `Get row(s) in sheet`):**
   * Adicionado um nó **Wait** (1 segundo) para garantir que os 3 ramos superiores processem seus filtros antes da contagem final.
   * Adicionado o nó **Code in JavaScript3** para contar quantos itens passaram em cada filtro (`Merge`, `Filter` e `Filter1`) de forma segura (retornando `0` caso algum filtro fique vazio).
   * Adicionado o nó **Respond to Webhook** configurado como **JSON** (em modo *Expression*) devolvendo a variável `{{ JSON.stringify($json.resumo) }}`.

3. **Publicação em Produção:**
   * O fluxo foi ativado com o botão **Publish**. Em produção, as execuções não animam a tela do *Editor*; elas ficam registradas na aba **Executions**.

---

## 3. Configuração do ngrok (Túnel Fixo e Automático)

Para não precisar abrir terminais manualmente nem trocar o link no código toda vez que o computador reiniciar:

* **Domínio Estático Gratuito:** `justly-obsession-parched.ngrok-free.dev`
* **Arquivo de Configuração:** `C:\Users\visio\AppData\Local\ngrok\ngrok.yml`

Estrutura do arquivo `ngrok.yml`:
```yaml
version: "2"
authtoken: SEU_AUTHTOKEN_AQUI
tunnels:
  n8n:
    proto: http
    addr: 5678
    domain: justly-obsession-parched.ngrok-free.dev
```

* **Serviço do Windows:** O ngrok foi instalado como um serviço nativo do sistema (`ngrok service install`), iniciando automaticamente em segundo plano junto com o Windows.

---

## 4. Código Configurado no Google Apps Script

Na planilha (**Extensões > Apps Script**), a função vinculada ao botão desenha a chamada HTTP e exibe o resultado:

```javascript
function acionarN8N() {
  const url = "https://justly-obsession-parched.ngrok-free.dev/webhook/656d750b-f027-4ab6-85cd-bfd2a2282013";
  
  const opcoes = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "ngrok-skip-browser-warning": "true"
    },
    "payload": JSON.stringify({
      "origem": "Google Sheets",
      "data": new Date().toISOString()
    }),
    "muteHttpExceptions": true
  };

  try {
    const resposta = UrlFetchApp.fetch(url, opcoes);
    
    if (resposta.getResponseCode() === 200) {
      const dados = JSON.parse(resposta.getContentText());
      SpreadsheetApp.getUi().alert("Processo concluído:\n\n" + dados.mensagem);
    } else {
      SpreadsheetApp.getUi().alert("Erro no n8n: " + resposta.getContentText());
    }
  } catch (erro) {
    SpreadsheetApp.getUi().alert("Não foi possível conectar. Verifique se o n8n está aberto.");
  }
}
```

---

## 5. Guia de Manutenção e Boas Práticas

### O que precisa estar ligado no dia a dia?
* **ngrok:** Já liga sozinho com o Windows (não precisa abrir terminal).
* **n8n:** Precisa estar aberto no seu computador (`localhost:5678`) e com o fluxo publicado (**Published**).

### Cuidados para não quebrar a integração
* **Sempre clique em "Publish" após editar o fluxo:** Alterações salvas no editor do n8n só passam a valer para o botão da planilha depois que você publica a nova versão.
* **Não apague o nó Webhook:** Se você deletar o nó Webhook e criar outro, o ID da URL vai mudar e será necessário atualizar a variável `url` no Apps Script.
* **Limites do plano gratuito do ngrok:** Permite até **20.000 requisições/mês** e **1 GB de banda**. Como cada clique no botão gera apenas 1 requisição leve, você tem folga para centenas de cliques diários.

---

## 6. Solução Rápida de Problemas (Troubleshooting)

| Erro / Sintoma | Causa Provável | Como Resolver |
| :--- | :--- | :--- |
| **`ERR_NGROK_3200` (Endpoint is offline)** | O serviço do ngrok no Windows está parado. | Abra o CMD como **Administrador** e rode: `ngrok service restart` |
| **`502 Bad Gateway`** | O túnel do ngrok está online, mas o **n8n está fechado** na sua máquina. | Inicie o n8n localmente no seu computador. |
| **`404 Not Found`** | O fluxo do n8n está desativado ou a URL está com `/webhook-test/` em vez de `/webhook/`. | Abra o n8n e clique em **Publish** no canto superior direito. |
| **`ERR_NGROK_121` (Agent version too old)** | A versão do ngrok ficou desatualizada perante o servidor. | No CMD como **Administrador**, rode:<br>`ngrok service stop`<br>`ngrok update`<br>`ngrok service start` |

---

## 7. Segurança e Migração de Computador

### Segurança Recomendada
1. **Redefinir Authtoken:** Caso o seu token tenha sido exposto, acesse o painel do ngrok (*Your Authtoken*), clique em **Reset Authtoken**, cole o novo código no arquivo `ngrok.yml` e rode `ngrok service restart` no CMD como Administrador.
2. **Proteção por Senha (Opcional):** É possível ativar **Authentication > Header Auth** no nó Webhook do n8n para exigir uma chave secreta nos `headers` do Apps Script.

### Como migrar para outro computador no futuro
Como a URL fixa pertence à sua conta do ngrok (e não ao PC), você **não precisará alterar nada na planilha**:
1. **No PC antigo:** Rode `ngrok service stop` no CMD como Administrador.
2. **No PC novo:**
   * Instale o n8n e importe o fluxo (mantendo o mesmo Path/ID no nó Webhook).
   * Instale o ngrok e crie o arquivo `ngrok.yml` com seu `authtoken` e o mesmo domínio (`justly-obsession-parched.ngrok-free.dev`).
   * No CMD como Administrador, rode `ngrok service install` e `ngrok service start`.
