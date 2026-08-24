export interface MovimentoAdicionarRequest {
    participanteCedenteId: string;
    participanteBeneficiarioId: string;
    dataInicialPerido: string;
    dataFinalPeriodo: string;
    mesAnoReferencia: string | null;
    creditoUtilizado: number;
    energiaConsumidaValorTusdAtiva: number;
    energiaConsumidaValorTeAtiva: number;
    energiaConsumidaBandeira: number;
    ipCipEncargos: number;
    creditoUtilizadoValorTusdInjetada: number;
    creditoUtilizadoValorTeInjetada: number;
    creditoUtilizadoBandeira: number;
    valorTotalSemDesconto: number;
    desconto: number;
    valorTotalComDesconto: number;
    valorCpfl: number;
    valorPagoParaCedente: number;
    valorPagoParaContratada: number;
    valorTotalPagoComCreditos: number;
    valorTotalPagoSemCreditos: number;
    economia: number;
    saldoRestante: number;
    dataLimitePagamentoConta: string;
    dataLimitePagamentoCedente: string;
    dataLimitePagamentoContratada: string;
}
