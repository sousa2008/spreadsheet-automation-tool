interface MetricaEvento {
    evento:string,
    totalConcluido:number,
    mediaDias:number,
    menorTempo:number,
    maiorTempo:number
}

class AnalisadorSLA {
    private aba: GoogleAppsScript.Spreadsheet.Sheet

    constructor(nomeAba:string){
        const abaEncontrada = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nomeAba)
        if(!abaEncontrada){
            throw new Error("[ERRO]");          
        }
        this.aba = abaEncontrada;
    }
    private calcularDatas(dataColeta:Date, dataUpload:Date):number{
        const valor = Math.floor((dataUpload.getTime() - dataColeta.getTime()) / (1000 * 60 * 60 * 24));
        return valor
    }
    public listaDeMetricas():MetricaEvento[]{
        const tempoPorEvento:Record<string, number[]> = {}
        const dados = this.aba.getDataRange().getValues()

        for(let i = 2; i < dados.length; i++){
            const linha = dados[i];
            const status = String(linha[8] || "").trim().toUpperCase();
            const dataColeta = linha[6];
            const dataUpload = linha[7]
            if (status !== "SUBIU" || !(dataColeta instanceof Date) || !(dataUpload instanceof Date)) {
                continue;
            }
            const dias = this.calcularDatas(dataColeta, dataUpload);
            if(dias < 0)continue;
            const evento = String(linha[5] || "SEM EVENTO").trim().toUpperCase();
            if(!tempoPorEvento[evento]){
                tempoPorEvento[evento] = []
            }
            tempoPorEvento[evento].push(dias)
        }
        return Object.keys(tempoPorEvento).map(evento => {
            const tempos = tempoPorEvento[evento]
            const soma = tempos.reduce((acc, atual) => acc + atual, 0);
            return{
                evento:evento,
                totalConcluido:tempos.length,
                menorTempo:Math.min(...tempos),
                maiorTempo:Math.max(...tempos),
                mediaDias:Number((soma / tempos.length).toFixed(1))
                    
            }
        })
    }

}

function executarAnaliseSLA():void{
    try{
      const analisador = new AnalisadorSLA("ARQUIVO");
      const metricas = analisador.listaDeMetricas();

      const ui = SpreadsheetApp.getUi()
      if(metricas.length === 0){
        ui.alert("Sem métricas para análise")
      }else{
        const relatorio = metricas.map(m => `${m.evento} (${m.totalConcluido} concluídos)\nMédia: ${m.mediaDias} dias | Menor: ${m.menorTempo}d | Maior: ${m.maiorTempo}`)
        ui.alert(relatorio.join("\n\n"))
      }
        
    }catch(erro: unknown){
        SpreadsheetApp.getUi().alert("Erro na análise de SLA: " + String(erro))
    }
}