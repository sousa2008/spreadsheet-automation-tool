type NivelUrgencia = "ATENCAO" | "CRITICO";

interface RegistroPendente {
    linhaPlanilha: number,
    dt:string,
    nf:number,
    evento:string,
    diasAtraso:number,
    urgencia:NivelUrgencia
}

class AuditorPlanilha {
    private aba: GoogleAppsScript.Spreadsheet.Sheet;
    private diasLimiteAtencao: number;
    private diasLimiteCritico: number;

    constructor(nomeAba:string, diasAtencao:number = 15, diasCritico:number = 30){
        const abaEncontrada = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nomeAba)
        if(!abaEncontrada){
            throw new Error("[ERRO]");
        }
        this.aba = abaEncontrada;
        this.diasLimiteAtencao = diasAtencao;
        this.diasLimiteCritico = diasCritico;
    }
    private calcularDiasAtraso(dataColeta: Date):number{
        const hoje = new Date()
        return Math.floor((hoje.getTime() - dataColeta.getTime())/(1000 * 60 * 60 * 24))
    }

    public auditarPendencias(): RegistroPendente[]{
        const dados = this.aba.getDataRange().getValues();
        const pendentes:RegistroPendente[] = [];
        for(let  i = 2; i<dados.length; i++){
            const linha = dados[i];
            const status = String(linha[8] || "").trim().toUpperCase();
            const dataColeta = linha[6];
            if(status === "SUBIU" || !(dataColeta instanceof Date)){
                continue;
            }
            const diasAtraso = this.calcularDiasAtraso(dataColeta);
            if(diasAtraso >= this.diasLimiteAtencao){
                const urgencia: NivelUrgencia = diasAtraso >= this.diasLimiteCritico ? "CRITICO" : "ATENCAO";
                pendentes.push({
                    linhaPlanilha: i + 1,
                    dt: String(linha[3]),
                    nf: Number(linha[4]),
                    evento: String(linha[5]),
                    diasAtraso:diasAtraso,
                    urgencia:urgencia,
                })
            }
        } 
        return pendentes;        
    }


}

function executarAuditoriaPlanilha(): void{
    try{
        const auditor = new AuditorPlanilha("ARQUIVO");
        const pendentes = auditor.auditarPendencias();
        const ui = SpreadsheetApp.getUi();
        if (pendentes.length === 0){
            ui.alert("Tudo em dia! Nenhuma pendência em atraso encontrada.");
        }else{
            const relatorio = pendentes.map(item => {
                return `[${item.urgencia} - LINHA ${item.linhaPlanilha} | DT: ${item.dt} | NF: ${item.nf} - (${item.diasAtraso} DIAS ATRADOS)]`
            })
             ui.alert(relatorio.join("\n"))
        }
    }catch(erro: unknown){
        SpreadsheetApp.getUi().alert("Erro na auditoria: " + String(erro))
    }
}