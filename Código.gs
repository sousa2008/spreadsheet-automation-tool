const propriedades = PropertiesService.getScriptProperties();
const urlBase = propriedades.getProperty('SUPABASE_URL'); 
const apiKey = propriedades.getProperty('SUPABASE_KEY');

// =========================================================================
// 1. NAVEGAÇÃO E MENUS (UI)
// =========================================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ Sistema LUPEON')
    .addItem('❗ NAVEGAÇÃO: ', 'titulo')
    .addItem('⬆️ Voltar para o Topo', 'voltarParaTopo')
    .addItem('⬇️ Ir para Última Linha', 'ultimaLinha')
    .addSeparator()
    .addItem('❗ TRIAGEM: ', 'titulo')
    .addItem('🕒 Conferir NFs sem Upload', 'pendentes')
    .addItem('📅 Conferir dia com mais upload', 'maisUploads')
    .addItem('📊 Conferir uploads de hoje', 'uploadsDeHoje')
    .addItem('❌ Conferir pendencias','executarAuditoriaPlanilha')
    .addSeparator()
    .addItem("❗ REGISTRAR: ", 'titulo')
    .addItem('📝 Adicionar Registros', 'abrirExplicacao')
    .addToUi();
}

function titulo() {
  SpreadsheetApp.getUi().alert("Isso é apenas o título da seção.")
}

function ultimaLinha() {
  const app = SpreadsheetApp.getActiveSpreadsheet();
  const abaAtual = app.getActiveSheet();
  const ultimaLinha = abaAtual.getLastRow();

  const celulaAlvo = abaAtual.getRange(ultimaLinha, 4);
  celulaAlvo.activate();
}

function voltarParaTopo() {
  const app = SpreadsheetApp.getActiveSpreadsheet();
  const abaAtual = app.getActiveSheet();

  const primeiraLinha = abaAtual.getRange(3, 4);
  primeiraLinha.activate();
}

function apagarPesquisa() {
  const app = SpreadsheetApp.getActiveSpreadsheet();
  const abaPesquisa = app.getSheetByName("PESQUISA");

  const celulaPesquisa = abaPesquisa.getRange(7, 7);
  celulaPesquisa.clearContent();

  const ultimaLinhaPesquisa = abaPesquisa.getLastRow();
  if (ultimaLinhaPesquisa >= 11) {
    abaPesquisa.getRange(11, 4, ultimaLinhaPesquisa - 10, 8).clearContent();
    abaPesquisa.getRange(11, 4).setValue("Aguardando dt...");
  }


  SpreadsheetApp.getUi().alert("Campo limpo com sucesso!");

}

// =========================================================================
// 2. MOTOR DE PESQUISA (FILTRO EM MEMÓRIA)
// =========================================================================

function pesquisar() {
  const app = SpreadsheetApp.getActiveSpreadsheet();
  const abaPesquisa = app.getSheetByName("PESQUISA");
  const abaArquivo = app.getSheetByName("ARQUIVO");

  const ultimaLinha = abaArquivo.getLastRow();
  const celulaErro = abaPesquisa.getRange(11, 4);

  // Captura o valor e limpa espaços acidentais nas pontas
  const valorDigitado = String(abaPesquisa.getRange(7, 7).getValue()).trim();

  if (valorDigitado === "") {
    return; // Encerra silenciosamente se a busca for vazia
  }

  // Trava de segurança se a base de dados estiver vazia
  if (ultimaLinha < 2) return;

  // Puxa todos os dados do banco para a memória RAM de uma vez
  const dadosArquivo = abaArquivo.getRange(2, 4, ultimaLinha - 1, 8).getValues();

  // Filtra as linhas onde a DT ou a NF batem com a pesquisa
  const resultado = dadosArquivo.filter(function (linha) {
    const dtLinha = String(linha[0]);
    const nfLinha = String(linha[1]);

    return dtLinha === valorDigitado || nfLinha === valorDigitado;
  });

  // A BORRACHA: Limpa resultados velhos da tela antes de colar os novos
  const ultimaLinhaPesquisa = abaPesquisa.getLastRow();
  if (ultimaLinhaPesquisa >= 11) {
    abaPesquisa.getRange(11, 4, ultimaLinhaPesquisa - 10, 8).clearContent();
  }

  // Exibição condicional dos resultados
  if (resultado.length > 0) {
    abaPesquisa.getRange(11, 4, resultado.length, 8).setValues(resultado);
  } else {
    celulaErro.setValue("documento não encontrado!");
  }
}


function abrirPesquisa(dadosFiltrados) {
  const template = HtmlService.createTemplateFromFile("pesquisa");
  template.dadosInjetados = JSON.stringify(dadosFiltrados);

  // Alterado: .evaluate() é obrigatório para processar o template e as tags <?= ?>
  const html = template.evaluate()
    .setWidth(600)
    .setHeight(450);

  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

function encontrarNf(nfForcada) {
  const pesquisa = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PESQUISA");

  // nfForcada tem prioridade, então caso ela exista (vem do js), ela sempre será passada na frente e será pesquisada
  const celulaNf = nfForcada ? nfForcada : pesquisa.getRange(11, 5).getValue();
  // elvis operator (if simplificado)

  const ultimaLinhaPesquisa = pesquisa.getLastRow();


  const resultadosRange = pesquisa.getRange(11, 4, ultimaLinhaPesquisa - 10, 8);
  const resultados = resultadosRange.getValues();

  const arquivo = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ARQUIVO");
  const ultimaLinha = arquivo.getLastRow();
  const dados = arquivo.getRange(3, 4, ultimaLinha - 2, 8).getValues();

  if (ultimaLinha < 3) {
    return;
  }

  // só cai aqui se realmente nf vindo do js não existir
  if (!nfForcada && resultados.length > 1) {
    // 1. Primeiro filtramos e mapeamos os dados reais existentes na tabela
    const filtrado = resultados.filter(function (linha) {
      return linha[1] && String(linha[1]).trim() !== "";
    }).map(function (linha) {
      const nf = linha[1];
      const evento = linha[2];
      return [nf, evento];
    });


    if (filtrado.length > 1) {
      abrirPesquisa(filtrado);
      return filtrado;
    }

  }


  if (celulaNf === "") {
    SpreadsheetApp.getUi().alert(`Célula NF em branco. Digite algum valor`);
    return;
  }

  const indice = dados.findIndex(function (linha) {
    return linha[1] === celulaNf;
  });

  if (indice !== -1) {
    celulaAlvo = indice + 3;
    arquivo.activate();
    arquivo.getRange(celulaAlvo, 5).activate();
  } else {
    SpreadsheetApp.getUi().alert(`Nota Fiscal ${celulaNf} não encontrada`);
  }
}

function selecionarNfEProcessar(nfEscolhida) {
  const pesquisa = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PESQUISA");

  // 1. Escreve a NF selecionada de volta na célula de busca (E11)
  pesquisa.getRange(11, 5).setValue(nfEscolhida);

  // 2. Executa a sua função principal novamente.
  // Como agora a célula E11 tem um valor específico, ela vai rodar a busca direta no "ARQUIVO".
  encontrarNf();
}

function pendentes() {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ARQUIVO")
  const ultimaLinha = arquivo.getLastRow()
  const dados = arquivo.getRange(3, 4, ultimaLinha - 2, 8).getValues()

  const semStatus = dados.filter(function (linha) {
    return linha[5] === ""    // vai na linha e vê onde o status (indice 5) é vazio
  }).map(function (linha) {
    return linha[1]           // retorna somente as nfs dessa linha 
  })

  if (semStatus.length === 0) {
    SpreadsheetApp.getUi().alert("✅ Parabéns! Todas as NFs já estão com status preenchido.");
    return;
  }

  const aviso = "Atenção, faltam subir as NFs: " + semStatus.join(", ");
  SpreadsheetApp.getUi().alert(aviso)

}
// =========================================================================
// 3. EVENTOS AUTOMÁTICOS (GATILHOS)
// =========================================================================

function onEdit(e) {
  const celulaEditada = e.range;
  const planilhaAtiva = celulaEditada.getSheet().getName();
  const linhaAtiva = celulaEditada.getRow();
  const colunaAtiva = celulaEditada.getColumn();
  const valorDigitado = e.value;

  // Proteção contra edições de múltiplas células simultâneas
  if (celulaEditada.getNumRows() > 1 || celulaEditada.getNumColumns() > 1) {
    return;
  }

  // --------------------------------------------------
  // MÓDULO: STATUS DE UPLOAD (ABA ARQUIVO)
  // --------------------------------------------------
  if (planilhaAtiva === "ARQUIVO" && colunaAtiva === 9) {
    const abaArquivo = celulaEditada.getSheet(); // Instancia a aba localmente
    const celulaUpload = abaArquivo.getRange(linhaAtiva, 8);
    const celulaMes = abaArquivo.getRange(linhaAtiva, 12);

    if (valorDigitado === "SUBIU") {
      // Validador de histórico: Só atua se a célula estiver vazia
      if (celulaUpload.getValue() !== "") {
        return;
      }

      const dataAtual = new Date();
      const dataUpload = formatarDataBrasil(dataAtual);
      celulaUpload.setValue(dataUpload);

      // Definição automática do mês
      const valorMes = dataAtual.getMonth();
      const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril",
        "Maio", "Junho", "Julho", "Agosto",
        "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
      //celulaMes.setValue(meses[valorMes]); ATIVAR NO FUTURO
    }
    else if (valorDigitado !== "SUBIU") {
      celulaUpload.clearContent();
      celulaMes.setValue("Sem mês registrado");
    }
  }

  // --------------------------------------------------
  // MÓDULO: PESQUISA AUTOMÁTICA (ABA PESQUISA)
  // --------------------------------------------------
  if (planilhaAtiva === "PESQUISA" && linhaAtiva === 7 && colunaAtiva === 7) {
    const abaPesquisa = celulaEditada.getSheet();
    const termoPesquisado = celulaEditada.getValue();
    const celulaErro = abaPesquisa.getRange(11, 4);

    // Se a célula estiver vazia (usuário apagou o termo)
    if (termoPesquisado === "") {
      const ultimaLinhaPesquisa = abaPesquisa.getLastRow();

      if (ultimaLinhaPesquisa >= 11) {
        abaPesquisa.getRange(11, 4, ultimaLinhaPesquisa - 10, 8).clearContent();
        celulaErro.setValue("Aguardando dt...");
      }

    }
    else {
      // Se tiver termo digitado, aciona o motor de pesquisa
      pesquisar();
    }
  }
}

// =========================================================================
// 4. INTEGRAÇÃO FRONT-END E IMPORTADOR
// =========================================================================

function abrirIndex() {
  const html = HtmlService.createHtmlOutputFromFile("index")
    .setWidth(600)
    .setHeight(450);

  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

function abrirExtra() {
  const html = HtmlService.createHtmlOutputFromFile("extra")
    .setWidth(600)
    .setHeight(450);

  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}



function abrirExplicacao() {
  const html = HtmlService.createHtmlOutputFromFile("exp").setHeight(450).setWidth(600)
  SpreadsheetApp.getUi().showModalDialog(html, ' ')
}

// ==========================================
// FUNÇÕES AUXILIARES 
// ==========================================

function isNumeroValido(valor, tamanhoMin, tamanhoMax) {
  if (!valor) return false;
  const texto = String(valor).trim();
  const eApenasNumero = /^\d+$/.test(texto);
  const tamanhoValido = texto.length >= tamanhoMin && texto.length <= tamanhoMax;
  return eApenasNumero && tamanhoValido;
}

function formatarDataISO(dataStr) {
  if (!dataStr || typeof dataStr !== 'string') return null;
  const partes = dataStr.trim().split('/');
  if (partes.length === 3 && partes[2].length === 4) {
    return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
  }
  return null;
}

// ==========================================
// FUNÇÃO PRINCIPAL
// ==========================================

function processarDadosColados(id, dados, nfsE) {
  const linhas = dados.split("\n");
  const matrizParaInserir = [];
  const abaArquivo = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ARQUIVO");
  const ultimaLinha = abaArquivo.getLastRow();

  if (id === 1) {
    let nfsExistentes = new Set();

    if (ultimaLinha > 1) {
      const valoresNfs = abaArquivo.getRange(2, 5, ultimaLinha - 1, 1).getValues();
      valoresNfs.forEach(linha => nfsExistentes.add(String(linha[0])));
    }

    for (let i = 0; i < linhas.length; i++) {
      if (linhas[i].trim() === "") continue;
      
      const colunas = linhas[i].split("\t");
      const dt = colunas[5];
      const dataColeta = colunas[11];
      const nf = colunas[22];

      // VALIDAÇÃO 1: Barrar lixos imediatamente
      if (!isNumeroValido(dt, 6, 9) || !isNumeroValido(nf, 3, 7)) {
        continue; // Ignora a linha inteira se a DT ou a NF não forem numéricas
      }

      // VALIDAÇÃO 2: Verificar duplicatas no banco/memória
      if (nfsExistentes.has(String(nf))) {
        continue;
      }

      const novaLinha = [dt, nf, "FRETE", dataColeta, "", "", "", ""];
      matrizParaInserir.push(novaLinha);
      nfsExistentes.add(String(nf));
    }

  } else if (id === 2) {
    let nfsExistentes = new Set();
    if (ultimaLinha > 1) {
      const valoresNfs = abaArquivo.getRange(2, 5, ultimaLinha - 1, 1).getValues();
      valoresNfs.forEach(linha => nfsExistentes.add(String(linha[0])));
    }

    // 1. LÊ APENAS A CAIXA DE TEXTO PRINCIPAL
    const linhasDados = dados.trim().split("\n");

    for (let i = 0; i < linhasDados.length; i++) {
      if (linhasDados[i].trim() === "") continue;

      const colunas = linhasDados[i].split("\t");
      
      // Se a linha for mais curta que a coluna 24, significa que não tem extra frete nela
      if (colunas.length < 25) continue; 

      const dt = colunas[5];
      const dataColeta = colunas[11];

      // O FILTRO NATURAL: Se for linha de cabeçalho intermediário ("DT", "TRANSPORTADORA"), 
      // a função isNumeroValido vai dar falso e o código pula a linha sem dar erro.
      if (!dt || !isNumeroValido(dt, 6, 9)) continue;

      // 2. EXTRAI OS EXTRA FRETES DIRETO DA MESMA LINHA
      // (Ignoramos o índice 23 que é o CIOT)
      const listaDeNfs = [
        colunas[24], // DESCARGA
        colunas[25], // REENTREGA
        colunas[26], // RETORNO
        colunas[27], // ESTADIA
        colunas[28], // DESLOCAMENTO VAZIO
        colunas[29]  // VALE-PEDÁGIO
      ];
      
      for (let j = 0; j < listaDeNfs.length; j++) {
        const nf = String(listaDeNfs[j] || "").trim();

        if (!isNumeroValido(nf, 3, 7)) continue;
        if (nfsExistentes.has(nf)) continue;

        let evento = "Evento não identificado";
        if (j === 0) evento = "DESCARGA";
        else if (j === 1) evento = "REENTREGA";
        else if (j === 2) evento = "RETORNO";
        else if (j === 3) evento = "ESTADIA";
        else if (j === 4) evento = "DESLOCAMENTO VAZIO";
        else if (j === 5) evento = "VALE-PEDÁGIO";

        const novaLinha = [dt, nf, evento, dataColeta, "", "", "", ""];
        matrizParaInserir.push(novaLinha);
        nfsExistentes.add(nf);
      }
    }

    // Inserção final na planilha (mantém igual)
    if (matrizParaInserir.length > 0) {
      var linhaFormat = abaArquivo.getRange(ultimaLinha - 1, 4, 1, abaArquivo.getLastColumn());
      linhaFormat.copyTo(abaArquivo.getRange(ultimaLinha + 1, 4, matrizParaInserir.length, 8).setValues(matrizParaInserir), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    }
  }

  // ==========================================
  // INSERÇÃO EM LOTE NA PLANILHA E NO SUPABASE
  // (Este bloco roda igual para o id 1 e 2)
  // ==========================================
  if (matrizParaInserir.length > 0) {
    
    // 1. Preparar pacote para o Supabase
    const pacoteSupabase = matrizParaInserir.map(linha => {
      return {
        dt: String(linha[0]),
        nf: String(linha[1]),
        evento: linha[2],
        data_coleta: formatarDataISO(String(linha[3]))
      };
    });


// 2. DISPARAR PARA A API COM ESCUDO (Try/Catch)
    const pacoteHttp = {
      method: 'post',
      headers: {
        'apikey': apiKey,
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      payload: JSON.stringify(pacoteSupabase),
      muteHttpExceptions: true
    };

    let textoStatus;
    let corFundo;

    // TRY: O sistema "tenta" executar este bloco
    try {
      const urlTabela = urlBase + 'controle_lupeon?on_conflict=dt,nf,evento';
      const resposta = UrlFetchApp.fetch(urlTabela, pacoteHttp);
      const codigoHttp = resposta.getResponseCode();

      // Avalia se o HTTP retornou Sucesso
      if (codigoHttp === 200 || codigoHttp === 201) {
        textoStatus = "SALVO";
        corFundo = "#d9ead3"; // Verde
      } else {
        textoStatus = "ERRO HTTP " + codigoHttp;
        corFundo = "#f4cccc"; // Vermelho
        // Grava no log o motivo da API ter rejeitado os dados
        registrarLog("Supabase API", "Código " + codigoHttp + ": " + resposta.getContentText());
      }

    } 
    // CATCH: Se der falha de rede, timeout ou crash, ele "captura" o erro e cai aqui
    catch (erro) {
      textoStatus = "FALHA DE REDE";
      corFundo = "#ffd966"; // Amarelo (Para diferenciar de erro de validação da API)
      
      // Grava no log a exceção exata gerada pelos servidores da Google
      registrarLog("processarDadosColados - Network", erro.message || erro);
    }
    // 3. COLAR DADOS NA PLANILHA
    for (let k = 0; k < matrizParaInserir.length; k++) {
      matrizParaInserir[k][7] = textoStatus; 
    }
    const urlTabela = urlBase + 'controle_lupeon?on_conflict=dt,nf,evento';
    const resposta = UrlFetchApp.fetch(urlTabela, pacoteHttp);
    const codigoHttp = resposta.getResponseCode();

    // 3. Status e Cores
    deuCerto = (codigoHttp === 200 || codigoHttp === 201);
    textoStatus = deuCerto ? "SALVO" : "ERRO " + codigoHttp;
    corFundo = deuCerto ? "#d9ead3" : "#f4cccc";

    for (let k = 0; k < matrizParaInserir.length; k++) {
      matrizParaInserir[k][7] = textoStatus; 
    }

    // 4. Colar na Planilha
    var linhaFormat = abaArquivo.getRange(ultimaLinha - 1, 4, 1, abaArquivo.getLastColumn());
    const intervaloNovos = abaArquivo.getRange(ultimaLinha + 1, 4, matrizParaInserir.length, 8);
    
    intervaloNovos.setValues(matrizParaInserir);
    linhaFormat.copyTo(intervaloNovos, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    
    abaArquivo.getRange(ultimaLinha + 1, 11, matrizParaInserir.length, 1).setBackground(corFundo);
  }
}


// =========================================================================
// 5. FUNÇÕES AUXILIARES / UTILITÁRIOS
// =========================================================================

function adicionarDataUpload() {
  const date = new Date();
  const dataFormatada = formatarDataBrasil(date);

  const app = SpreadsheetApp.getActiveSpreadsheet();
  const abaArquivo = app.getSheetByName("ARQUIVO");

  const ultimaLinha = abaArquivo.getLastRow();
  const linhaDestino = ultimaLinha + 1;
  const linhaDataUpload = abaArquivo.getRange(linhaDestino, 8);

  linhaDataUpload.setValue(dataFormatada);
}

function formatarDataBrasil(dataDesformatada) {
  const timezone = "America/Sao_Paulo";
  const brasilDate = Utilities.formatDate(dataDesformatada, timezone, "dd/MM");

  return brasilDate;
}

function resumoMes() {

  const abaArquivo = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ARQUIVO");
  const ultimaLinha = abaArquivo.getLastRow();

  // Trava de segurança
  if (ultimaLinha < 3) return;

  const dadosArquivo = abaArquivo.getRange(3, 4, ultimaLinha - 2, 8).getValues();


  const contagem = dadosArquivo.reduce(function (acumulador, linha) {
    const nomeMes = String(linha[7]).trim();


    if (nomeMes === "" || nomeMes === "Sem mês registrado") {
      return acumulador;
    }


    if (!acumulador[nomeMes]) {
      acumulador[nomeMes] = 1;
    } else {
      acumulador[nomeMes] += 1;
    }

    return acumulador;
  }, {});
  // O JSON.stringify converte o objeto em uma string legível
  SpreadsheetApp.getUi().alert(JSON.stringify(contagem, null, 2));

}

function maisUploads() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const arquivo = planilha.getSheetByName("ARQUIVO");
  const ultimaLinha = arquivo.getLastRow();
  
  if (ultimaLinha < 3) {
    SpreadsheetApp.getUi().alert("Sem dados suficientes.");
    return;
  }

  // Pega a linha 3, coluna 8 (H), até a última linha com dados
  const totalLinhas = ultimaLinha - 2;
  const valoresData = arquivo.getRange(3, 8, totalLinhas, 1).getValues();
  const contagemDias = {};

  // Loop para contar a frequência de cada data
  for (let i = 0; i < valoresData.length; i++) {
    let dataFormatada = valoresData[i][0];
    
    // Ignora células vazias
    if (!dataFormatada) continue;

    // Se a data for um objeto Date do JS, converte para string/texto legível
    if (dataFormatada instanceof Date) {
      dataFormatada = Utilities.formatDate(dataFormatada, planilha.getSpreadsheetTimeZone(), "dd/MM/yyyy");
    }

    // Conta a ocorrência da data
    contagemDias[dataFormatada] = (contagemDias[dataFormatada] || 0) + 1;
  }

  // 1. Transforma o objeto { "data": quantidade } em uma lista de arrays: [ ["data", quantidade], ... ]
  const listaOrdenada = Object.keys(contagemDias).map(function(data) {
    return [data, contagemDias[data]];
  });

  // 2. Ordena a lista do maior para o menor com base na quantidade de uploads
  listaOrdenada.sort(function(a, b) {
    return b[1] - a[1];
  });

  // 3. Pega apenas os 3 primeiros colocados (ou menos, caso existam poucos dias no arquivo)
  const topTres = listaOrdenada.slice(0, 3);

  // 4. Monta o texto de exibição do ranking
  let mensagem = "🏆 TOP 3 DIAS COM MAIS UPLOADS:\n\n\n";
  
  for (let j = 0; j < topTres.length; j++) {
    mensagem += (j + 1) + "º Lugar: " + topTres[j][0] + " — " + topTres[j][1] + " envios.\n";
  }

  // Se o objeto estiver vazio (caso a planilha só tenha células em branco na coluna)
  if (topTres.length === 0) {
    mensagem = "Nenhum dado de upload foi encontrado.";
  }

  // Retorna o resultado em um alerta na tela
  SpreadsheetApp.getUi().alert(mensagem);
}

function uploadsDeHoje() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const arquivo = planilha.getSheetByName("ARQUIVO");
  const ultimaLinha = arquivo.getLastRow();

  if (ultimaLinha < 3) {
    SpreadsheetApp.getUi().alert('Sem dados suficientes.');
    return;
  }

  // Pega a linha 3, coluna 8 (H), até a última linha com dados
  const totalLinhas = ultimaLinha - 2;
  const valoresData = arquivo.getRange(3, 8, totalLinhas, 1).getValues();

  // Formata a data de hoje no mesmo padrão (dd/MM/yyyy) usando a zona da planilha
  const hoje = Utilities.formatDate(new Date(), planilha.getSpreadsheetTimeZone(), 'dd/MM/yyyy');
  let contadorHoje = 0;

  for (let i = 0; i < valoresData.length; i++) {
    let valorCelula = valoresData[i][0];
    if (!valorCelula) continue;

    // Converte o valor da célula para string formatada se for objeto Date
    if (valorCelula instanceof Date) {
      valorCelula = Utilities.formatDate(valorCelula, planilha.getSpreadsheetTimeZone(), 'dd/MM/yyyy');
    } else {
      // Se já estiver como texto, garante que está apenas com a data (caso venha com horário, etc.)
      valorCelula = String(valorCelula).trim();
    }

    if (valorCelula === hoje) {
      contadorHoje++;
    }
  }

  const mensagem = `📅 UPLOADS REALIZADOS HOJE (${hoje}):\n\nTotal: ${contadorHoje} envio(s).`;
  SpreadsheetApp.getUi().alert(mensagem);
}


function isNFValida(nf) {
  if (!nf) return false;
  const nfTexto = String(nf).trim();
  
  // Regra 1: Deve conter APENAS números (bloqueia "PO FRETE", "ok", "????", "ATA COLETA")
  const eApenasNumero = /^\d+$/.test(nfTexto);
  
  // Regra 2: Deve ter um tamanho mínimo real de NF (ex: pelo menos 3 dígitos)
  const tamanhoValido = nfTexto.length >= 3 && nfTexto.length <= 10;
  
  return eApenasNumero && tamanhoValido;
}
