"use strict";
class AuditorPlanilha {
    constructor(nomeAba, diasAtencao = 15, diasCritico = 30) {
        const abaEncontrada = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nomeAba);
        if (!abaEncontrada) {
            throw new Error("[ERRO]");
        }
        this.aba = abaEncontrada;
        this.diasLimiteAtencao = diasAtencao;
        this.diasLimiteCritico = diasCritico;
    }
    calcularDiasAtraso(dataColeta) {
        const hoje = new Date();
        return Math.floor((hoje.getTime() - dataColeta.getTime()) / (1000 * 60 * 60 * 24));
    }
    auditarPendencias() {
        const dados = this.aba.getDataRange().getValues();
        const pendentes = [];
        for (let i = 2; i < dados.length; i++) {
            const linha = dados[i];
            const status = String(linha[8] || "").trim().toUpperCase();
            const dataColeta = linha[6];
            if (status === "SUBIU" || !(dataColeta instanceof Date)) {
                continue;
            }
            const diasAtraso = this.calcularDiasAtraso(dataColeta);
            if (diasAtraso >= this.diasLimiteAtencao) {
                const urgencia = diasAtraso >= this.diasLimiteCritico ? "CRITICO" : "ATENCAO";
                pendentes.push({
                    linhaPlanilha: i + 1,
                    dt: String(linha[3]),
                    nf: Number(linha[4]),
                    evento: String(linha[5]),
                    status: status,
                    diasAtraso: diasAtraso,
                    urgencia: urgencia,
                });
            }
        }
        return pendentes;
    }
}
function executarAuditoriaPlanilha() {
    try {
        const auditor = new AuditorPlanilha("ARQUIVO");
        const pendentes = auditor.auditarPendencias();
        const ui = SpreadsheetApp.getUi();
        if (pendentes.length === 0) {
            ui.alert("Tudo em dia! Nenhuma pendência em atraso encontrada.");
        }
        else {
            const grupos = {};
            pendentes.forEach(item => {
                const chaveStatus = item.status || "SEM STATUS";
                if (!grupos[chaveStatus]) {
                    grupos[chaveStatus] = [];
                }
                grupos[chaveStatus].push(item);
            });
            const relatorio = Object.keys(grupos).map(status => {
                const itensDoGrupo = grupos[status];
                const linhaFormatada = itensDoGrupo.map(item => `[${item.urgencia} - LINHA ${item.linhaPlanilha} | DT: ${item.dt} | NF: ${item.nf} - (${item.diasAtraso} DIAS ATRASADOS)]`);
                return `${status}\n${linhaFormatada.join("\n")}`;
            });
            ui.alert(relatorio.join("\n\n"));
        }
    }
    catch (erro) {
        SpreadsheetApp.getUi().alert("Erro na auditoria: " + String(erro));
    }
}
