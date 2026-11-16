function configurarCofre() {
  const propriedades = PropertiesService.getScriptProperties();
  propriedades.setProperty('SUPABASE_URL', '');
  propriedades.setProperty('SUPABASE_KEY', '');
}
// CÓDIGO ORIGINAL (Não perca o seu link verdadeiro!)
// const urlBase = 'https://ntegpwibjtoamvajlwxk.supabase.co/rest/v1/';

// CÓDIGO SABOTADO


function enviarParaSupabase(dadosParaEnviar){
  // 1. Resgatar as chaves seguras do cofre
  const propriedades = PropertiesService.getScriptProperties();
  const urlBase = propriedades.getProperty('SUPABASE_URL'); 
  const apiKey = propriedades.getProperty('SUPABASE_KEY');

  // 2. Montar o Endpoint da tabela
  // O Supabase espera a URL base + o nome exato da tabela
  // Adicionamos a dt na lista do on_conflict
  const urlTabela = urlBase + 'controle_lupeon?on_conflict=dt,nf,evento';

  // 3. Montar o Payload (O dado simulado)
  // As chaves deste objeto DEVEM ser idênticas às colunas criadas no SQL

  // 4. Configurar o "pacote" da requisição HTTP
  const pacoteHttp = {
    method: 'post',
    headers: {
      'apikey': apiKey,
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates' // Instrução fundamental para Upsert

    },
    // JSON.stringify converte o objeto JavaScript em um texto que a API consegue ler
    payload: JSON.stringify(dadosParaEnviar), 
    
    // muteHttpExceptions: true impede que o Apps Script trave a tela se o Supabase der erro.
    // Assim conseguimos ler a mensagem de erro que o banco retornou.
    muteHttpExceptions: true 
  };

  // 5. Disparar a requisição usando a classe UrlFetchApp
  const resposta = UrlFetchApp.fetch(urlTabela, pacoteHttp);

  
  const codigoHttp = resposta.getResponseCode();
  const corpoResposta = resposta.getContentText(); 
    Logger.log('Código de Status HTTP: ' + codigoHttp);
  Logger.log('Resposta do Supabase: ' + corpoResposta);

  // Se o código não for de sucesso, gravamos o erro no Log para investigação
  if (codigoHttp !== 200 && codigoHttp !== 201) {
    Logger.log("ALERTA DE ERRO HTTP " + codigoHttp + ": " + corpoResposta);
  }
  
  // Devolve apenas o número para o onEdit pintar a tela
  return codigoHttp; 
}



function pegarDados(){
  const arquivo = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ARQUIVO")
  const ultimaLinha = arquivo.getLastRow()
  const areaDados = arquivo.getRange(3, 4, ultimaLinha - 2, 7).getValues();
  let dadosSQL = areaDados.map((linha) =>{
    return {
      dt: String(linha[0]),
      nf: String(linha[1]),
      evento: linha[2],
      data_coleta: linha[3] ? Utilities.formatDate(new Date(linha[3]), Session.getScriptTimeZone(), "yyyy-MM-dd") : null, 
      data_upload: linha[4] ? Utilities.formatDate(new Date(linha[4]), Session.getScriptTimeZone(), "yyyy-MM-dd") : null,
      status: linha[5],
      observacao: linha[6]
      }
  } )
  enviarParaSupabase(dadosSQL)
}



function dispararAoEditar(e) {
  // 1. Validar se o objeto de evento existe (evita erros se rodar manualmente)
  if (!e || !e.range) return;
  
  const abaEditada = e.range.getSheet();
  const nomeAba = abaEditada.getName();
  
  // 2. Verificar se a edição foi na aba correta
  if (nomeAba !== "ARQUIVO") return;
  
  const linhaEditada = e.range.getRow();
  
  // 3. Verificar se não foi edição no cabeçalho
  if (linhaEditada < 3) return;
  
  // 4. Capturar os dados da linha inteira que foi editada
  // getRange(linha, coluna inicial, número de linhas, número de colunas)
  const dadosDaLinha = abaEditada.getRange(linhaEditada, 4, 1, 7).getValues()[0];
  
  // 5. Mapear a linha capturada para o formato JSON esperado pelo Supabase
  const pacoteAtualizacao = {
    dt: String(dadosDaLinha[0]),
    nf: String(dadosDaLinha[1]),
    evento: dadosDaLinha[2],
    // Ajuste de Data: Verifica se a célula tem um valor válido antes de converter
    data_coleta: dadosDaLinha[3] ? Utilities.formatDate(new Date(dadosDaLinha[3]), Session.getScriptTimeZone(), "yyyy-MM-dd") : null,
    data_upload: dadosDaLinha[4] ? Utilities.formatDate(new Date(dadosDaLinha[4]), Session.getScriptTimeZone(), "yyyy-MM-dd") : null,
    status: dadosDaLinha[5],
    observacao: dadosDaLinha[6]
  };
  
  // Extrai os valores das 3 primeiras colunas
  const dtAtual = String(dadosDaLinha[0]);
  const nfAtual = String(dadosDaLinha[1]);
  const eventoAtual = dadosDaLinha[2];
  
  // Barreira de Proteção: Se a DT, a NF ou o Evento estiverem em branco, para a execução.
  if (dtAtual === "" || dtAtual === "null" || nfAtual === "" || nfAtual === "null" || !eventoAtual) {
    return; // O script morre aqui de forma silenciosa e não gasta requisições HTTP
  }
  
  // 6. Enviar para a função que comunica com o Supabase
  // enviando dentro de um array [ ] porque a sua função esperar receber um lote
  const codigoHTTP = enviarParaSupabase([pacoteAtualizacao]); 

  const celulaFeedback = abaEditada.getRange(linhaEditada, 11);

  if (codigoHTTP === 200 || codigoHTTP === 2001){
    celulaFeedback.setValue("SALVO NO BANCO");
    celulaFeedback.setBackground("#d9ead3"); // Cor de fundo Verde Claro
  }else{
    celulaFeedback.setValue("ERRO NO BANCO");
    celulaFeedback.setBackground("#f4cccc"); // Cor de fundo Vermelho Claro
  }
  
}
function pintarTudoDeUmaVez() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ARQUIVO");
  const ultimaLinha = aba.getLastRow();
  
  // Se a planilha estiver vazia (só com cabeçalhos), não faz nada
  if (ultimaLinha < 3) return; 
  
  // 1. LÊ EM LOTE: Pega os dados da Coluna 4 (DT) até a Coluna 6 (Evento)
  // getRange(linha inicial, coluna inicial, número de linhas, número de colunas)
  const dados = aba.getRange(3, 4, ultimaLinha - 2, 3).getValues();
  
  // 2. Cria as "caixas vazias" (Arrays) para guardar as nossas cores e textos na memória
  const matrizTextos = [];
  const matrizCores = [];
  
  // 3. Varre os dados na memória (super rápido, não gasta cota do Google)
  for (let i = 0; i < dados.length; i++) {
    const dt = String(dados[i][0]);
    const nf = String(dados[i][1]);
    const evento = dados[i][2];
    
    // Se a linha tem a chave composta preenchida, prepara o verde
    if (dt !== "" && dt !== "null" && nf !== "" && nf !== "null" && evento !== "") {
      matrizTextos.push(["SALVO"]);
      matrizCores.push(["#d9ead3"]);
    } else {
      // Se não, deixa em branco
      matrizTextos.push([""]); 
      matrizCores.push([null]);
    }
  }
  
  // 4. ESCREVE EM LOTE: Pega o intervalo exato da Coluna 8 (STATUS BANCO)
  // Atenção: Mude o '8' se a sua coluna STATUS BANCO não for a oitava coluna (H)
  const rangeStatus = aba.getRange(3, 11, matrizTextos.length, 1);
  
  // Cola todos os textos e cores de uma só vez
  rangeStatus.setValues(matrizTextos);
  rangeStatus.setBackgrounds(matrizCores);
}


function registrarLog(origem, mensagemErro) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let abaLogs = ss.getSheetByName("LOGS_SISTEMA");
  
  // Se a aba não existir, o próprio script cria e formata o cabeçalho sozinho
  if (!abaLogs) {
    abaLogs = ss.insertSheet("LOGS_SISTEMA");
    abaLogs.appendRow(["DATA/HORA", "ORIGEM DO ERRO", "DETALHE TÉCNICO"]);
    abaLogs.getRange("A1:C1").setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  // Captura o momento exato da falha
  const dataAtual = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
  
  // Insere a nova linha de erro no final da planilha
  abaLogs.appendRow([dataAtual, origem, String(mensagemErro)]);
}
