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
    const filtrado = resultados.filter(function(linha) {
      return linha[1] && String(linha[1]).trim() !== "";
    }).map(function(linha) {
      const nf = linha[1];
      const evento = linha[2];
      return [nf, evento];
    });
    

    if (filtrado.length > 1) {
      SpreadsheetApp.getUi().alert(JSON.stringify(filtrado)); // Coloque isso antes de abrirPesquisa(filtrado)
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
    const celulaMes = abaArquivo.getRange(linhaAtiva, 11);

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
      celulaMes.setValue(meses[valorMes]);
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

function processarDadosColados(id, dados, nfsE) {
  const linhas = dados.split("\n");
  const matrizParaInserir = [];

  const abaArquivo = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ARQUIVO");
  const ultimaLinha = abaArquivo.getLastRow();
  if (id === 1) {
    // VALIDADOR DE NF DUPLICADA (Busca O(1) usando Set)
    let nfsExistentes = new Set();

    if (ultimaLinha > 1) {
      const valoresNfs = abaArquivo.getRange(2, 5, ultimaLinha - 1, 1).getValues();
      valoresNfs.forEach(linha => nfsExistentes.add(String(linha[0])));
    }

    for (let i = 0; i < linhas.length; i++) {
      if (linhas[i].trim() === "") continue;
      let evento = "FRETE"

      const colunas = linhas[i].split("\t");
      const dt = colunas[5];
      const dataColeta = colunas[11];
      const nf = colunas[22];

      // Se a NF já estiver no banco, pula o registro
      if (nfsExistentes.has(String(nf))) {
        continue;
      }

      const novaLinha = [dt, nf, evento, dataColeta, "", "", "", ""];
      matrizParaInserir.push(novaLinha);

      // Protege contra NFs repetidas dentro da própria área de transferência copiada
      nfsExistentes.add(String(nf));
    }

    // Inserção final na planilha
    if (matrizParaInserir.length > 0) {
      var linhaFormat = abaArquivo.getRange(ultimaLinha - 1, 4, 1, abaArquivo.getLastColumn());

      linhaFormat.copyTo(abaArquivo.getRange(ultimaLinha + 1, 4, matrizParaInserir.length, 8).setValues(matrizParaInserir), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false)
      // transforma todos os novos dados com a formatação da linha já existente
    }
  }
  else if (id === 2) {
    // VALIDADOR DE NF DUPLICADA (Busca O(1) usando Set)
    let nfsExistentes = new Set();

    if (ultimaLinha > 1) {
      const valoresNfs = abaArquivo.getRange(2, 5, ultimaLinha - 1, 1).getValues();
      valoresNfs.forEach(linha => nfsExistentes.add(String(linha[0])));
    }
    const linhaDados = dados.split("\n")
    const linhasNfs = nfsE.split("\n")

    for (let i = 0; i < linhas.length; i++) {
      if (linhas[i].trim() === "") continue;

      // textarea dados
      const colunas = linhas[i].split("\t");
      const dt = colunas[5];
      const dataColeta = colunas[11];

      // TRAVA DE SEGURANÇA: Se a linha de NFs não existir (cópia desalinhada), pula.
      if (linhasNfs[i] === undefined) continue;


      const listaDeNfs = linhasNfs[i].split("\t");
      // 4. O LAÇO ANINHADO (O Segredo para duplicar a DT)
      // Ele vai varrer a lista de NFs daquela linha específica
      for (let j = 0; j < listaDeNfs.length; j++) {
        const nf = String(listaDeNfs[j]).trim();
        
        // valida qual coluna está e define o evento
        let evento = "teste"
        if (j === 0) { 
          evento = "DESCARGA"
        }
        else if (j === 1) {
          evento = "REENTREGA"
        }
        else if (j === 2) {
          evento = "RETORNO"
        }
        else if (j === 3) {
          evento = "ESTADIA"
        }
        else if (j === 4) {
          evento = "DESLOCAMENTO VAZIO"
        }
        else{
          evento = "Evento não identificado"
        }
        
        // Se a célula dessa coluna copiada estava vazia, ignora e vai pra próxima
        if (nf === "") continue;

        // Se a NF já existe no banco, ignora
        if (nfsExistentes.has(nf)) continue;

        // Monta a linha nova!
        // Perceba que usamos a variável 'dt' do laço de fora, 
        // então ela vai se repetir para cada NF que passar por aqui!
        const novaLinha = [dt, nf, evento, dataColeta, "", "", "", ""];
        matrizParaInserir.push(novaLinha);

        nfsExistentes.add(nf);
      }
    }
    // Inserção final na planilha
    if (matrizParaInserir.length > 0) {
      var linhaFormat = abaArquivo.getRange(ultimaLinha - 1, 4, 1, abaArquivo.getLastColumn());

      linhaFormat.copyTo(abaArquivo.getRange(ultimaLinha + 1, 4, matrizParaInserir.length, 8).setValues(matrizParaInserir), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false)
      // transforma todos os novos dados com a formatação da linha já existente
    }
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