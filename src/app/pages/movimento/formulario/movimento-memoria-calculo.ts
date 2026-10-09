export const TIPOS_COM_EMISSAO_NOTA_FISCAL = ['Emissao220', 'EmissaoCedente', 'EmissaoCompartilhada'];

export interface DadosEntradaCalculo {
    creditoUtilizado: number;
    energiaConsumidaValorTusdAtiva: number;
    energiaConsumidaValorTeAtiva: number;
    energiaConsumidaBandeira: number;
    ipCipEncargos: number;
    creditoUtilizadoValorTusdInjetada: number;
    creditoUtilizadoValorTeInjetada: number;
    creditoUtilizadoBandeira: number;
    valorCpfl: number;
}

export interface ContratoCalculo {
    bandeiraTipoCobranca: string;
    beneficiarioPercentualDesconto: number | null;
    cedenteBaseCalculo: string;
    notaFiscalBaseCalculo: string;
    notaFiscalTipoEmissao: string;
    notaFiscalPercentualEmissao: number;
    cedenteTipoNegociacao: string;
    cedenteValorNegociacao: number;
    flagValorContaEnergiaInclusoNoPagamentoAoCedente: boolean;
}

export interface ResultadoCalculo {
    valorTotalSemDesconto: number;
    valorDesconto: number;
    valorTotalComDesconto: number;
    valorPagoParaCedenteParcial: number;
    valorPagoParaContratadaParcial: number;
    valorBaseCalculoCedente: number;
    valorBaseCalculoNotaFiscal: number;
    valorEmissaoNotaFiscal: number;
    valorPagoParaContratada: number;
    valorTotalPagoComCreditos: number;
    valorTotalPagoSemCreditos: number;
    valorEconomia: number;
    valorEmissaoNotaFiscalCedente: number;
    valorPagoParaCedente: number;
}

const moeda = (valor: number | null | undefined) => (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const numero = (valor: number | null | undefined) => (valor ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 4 });
const simNao = (valor: boolean) => (valor ? 'Sim' : 'Não');

class MemoriaCalculo {
    private readonly linhas: string[] = [];

    titulo(texto: string) {
        if (this.linhas.length > 0) {
            this.linhas.push('');
        }
        this.linhas.push(texto);
    }

    regra(texto: string) {
        this.linhas.push(`   Regra: ${texto}`);
    }

    /** Lista de variáveis alinhadas: nome = valor (descrição) */
    variaveis(entradas: [nome: string, valor: string | null | undefined, descricao: string][]) {
        const lista = entradas.map(([nome, valor, descricao]) => [nome, valor ?? '-', descricao] as const);
        const larguraNome = Math.max(...lista.map(([nome]) => nome.length));
        const larguraValor = Math.max(...lista.map(([, valor]) => valor.length));
        for (const [nome, valor, descricao] of lista) {
            this.linhas.push(`   ${nome.padEnd(larguraNome)} = ${valor.padEnd(larguraValor)}   (${descricao})`);
        }
    }

    /** Linha de cima: fórmula. Linha de baixo: resolução com os valores e o resultado. */
    formula(nome: string, formula: string, resolucao: string, resultado: number, formatar: (valor: number) => string = moeda) {
        const recuo = ' '.repeat(nome.length);
        const valorResultado = formatar(resultado);
        const linhaResolucao = resolucao === valorResultado ? `   ${recuo} = ${valorResultado}` : `   ${recuo} = ${resolucao} = ${valorResultado}`;
        this.linhas.push(`   ${nome} = ${formula}`, linhaResolucao);
    }

    toString() {
        return this.linhas.join('\n');
    }
}

export function gerarMemoriaCalculo(entrada: DadosEntradaCalculo, contrato: ContratoCalculo, r: ResultadoCalculo): string {
    const m = new MemoriaCalculo();

    etapaDadosEntrada(m, entrada);
    etapaDadosContrato(m, contrato);
    etapaValoresIniciais(m, entrada, contrato, r);
    etapaBasesCalculo(m, contrato, r);
    etapaEmissaoNotaFiscal(m, contrato, r);
    etapaPagamentoContratada(m, entrada, contrato, r);
    etapaTotaisEconomia(m, entrada, r);
    etapaNotaFiscalCedente(m, contrato, r);
    etapaPagamentoCedente(m, entrada, contrato, r);
    etapaResultadoFinal(m, r);

    return m.toString();
}

function etapaDadosEntrada(m: MemoriaCalculo, entrada: DadosEntradaCalculo) {
    m.titulo('1) Dados de entrada (formulário)');
    m.variaveis([
        ['creditoUtilizado', `${numero(entrada.creditoUtilizado)} kWh`, 'Créditos utilizados'],
        ['energiaConsumidaValorTusdAtiva', moeda(entrada.energiaConsumidaValorTusdAtiva), 'TUSD Ativa - Energia Consumida'],
        ['energiaConsumidaValorTeAtiva', moeda(entrada.energiaConsumidaValorTeAtiva), 'TE Ativa - Energia Consumida'],
        ['energiaConsumidaBandeira', moeda(entrada.energiaConsumidaBandeira), 'Bandeira - Energia Consumida'],
        ['ipCipEncargos', moeda(entrada.ipCipEncargos), 'IP-CIP / Encargos'],
        ['creditoUtilizadoValorTusdInjetada', moeda(entrada.creditoUtilizadoValorTusdInjetada), 'TUSD Injetada - Crédito Utilizado'],
        ['creditoUtilizadoValorTeInjetada', moeda(entrada.creditoUtilizadoValorTeInjetada), 'TE Injetada - Crédito Utilizado'],
        ['creditoUtilizadoBandeira', moeda(entrada.creditoUtilizadoBandeira), 'Bandeira - Crédito Utilizado'],
        ['valorCpfl', moeda(entrada.valorCpfl), 'Valor da conta CPFL']
    ]);
}

function etapaDadosContrato(m: MemoriaCalculo, contrato: ContratoCalculo) {
    m.titulo('2) Dados do contrato');
    m.variaveis([
        ['bandeiraTipoCobranca', contrato.bandeiraTipoCobranca, 'Bandeira tipo cobrança'],
        ['beneficiarioPercentualDesconto', numero(contrato.beneficiarioPercentualDesconto), 'Percentual de desconto do beneficiário'],
        ['cedenteBaseCalculo', contrato.cedenteBaseCalculo, 'Base de cálculo do cedente'],
        ['notaFiscalBaseCalculo', contrato.notaFiscalBaseCalculo, 'Base de cálculo da nota fiscal'],
        ['notaFiscalTipoEmissao', contrato.notaFiscalTipoEmissao, 'Tipo de emissão da nota fiscal'],
        ['notaFiscalPercentualEmissao', numero(contrato.notaFiscalPercentualEmissao), 'Percentual de emissão da nota fiscal'],
        ['cedenteTipoNegociacao', contrato.cedenteTipoNegociacao, 'Tipo de negociação do cedente'],
        ['cedenteValorNegociacao', numero(contrato.cedenteValorNegociacao), 'Valor de negociação do cedente'],
        ['flagValorContaEnergiaInclusoNoPagamentoAoCedente', simNao(contrato.flagValorContaEnergiaInclusoNoPagamentoAoCedente), 'Conta de energia inclusa no pagamento ao cedente']
    ]);
}

function etapaValoresIniciais(m: MemoriaCalculo, entrada: DadosEntradaCalculo, contrato: ContratoCalculo, r: ResultadoCalculo) {
    const tusd = moeda(entrada.creditoUtilizadoValorTusdInjetada);
    const te = moeda(entrada.creditoUtilizadoValorTeInjetada);

    m.titulo('3) Valor total, desconto e valores parciais');
    m.regra(`bandeiraTipoCobranca = ${contrato.bandeiraTipoCobranca}`);

    if (contrato.bandeiraTipoCobranca === 'BandeiraAntesDoDesconto') {
        m.formula('valorTotalSemDesconto', 'creditoUtilizadoValorTusdInjetada + creditoUtilizadoValorTeInjetada + creditoUtilizadoValorTeInjetada', `${tusd} + ${te} + ${te}`, r.valorTotalSemDesconto);
    } else {
        m.formula('valorTotalSemDesconto', 'creditoUtilizadoValorTusdInjetada + creditoUtilizadoValorTeInjetada', `${tusd} + ${te}`, r.valorTotalSemDesconto);
    }

    m.formula('valorDesconto', 'valorTotalSemDesconto × beneficiarioPercentualDesconto / 100',
        `${moeda(r.valorTotalSemDesconto)} × ${numero(contrato.beneficiarioPercentualDesconto)} / 100`, r.valorDesconto);
    m.formula('valorTotalComDesconto', 'valorTotalSemDesconto - valorDesconto',
        `${moeda(r.valorTotalSemDesconto)} - ${moeda(r.valorDesconto)}`, r.valorTotalComDesconto);

    if (contrato.bandeiraTipoCobranca === 'BandeiraAntesDoDesconto') {
        m.formula('valorPagoParaCedenteParcial', 'valorTotalComDesconto', moeda(r.valorTotalComDesconto), r.valorPagoParaCedenteParcial);
        m.formula('valorPagoParaContratadaParcial', '0', moeda(0), r.valorPagoParaContratadaParcial);
    } else if (contrato.bandeiraTipoCobranca === 'BandeiraAposDesconto') {
        m.formula('valorPagoParaCedenteParcial', 'valorTotalComDesconto + creditoUtilizadoBandeira',
            `${moeda(r.valorTotalComDesconto)} + ${moeda(entrada.creditoUtilizadoBandeira)}`, r.valorPagoParaCedenteParcial);
        m.formula('valorPagoParaContratadaParcial', '0', moeda(0), r.valorPagoParaContratadaParcial);
    } else {
        m.formula('valorPagoParaCedenteParcial', 'valorTotalComDesconto + creditoUtilizadoValorTeInjetada', `${moeda(r.valorTotalComDesconto)} + ${te}`, r.valorPagoParaCedenteParcial);
        m.formula('valorPagoParaContratadaParcial', 'creditoUtilizadoValorTeInjetada', te, r.valorPagoParaContratadaParcial);
    }
}

function etapaBasesCalculo(m: MemoriaCalculo, contrato: ContratoCalculo, r: ResultadoCalculo) {
    const origem = (baseCalculo: string) => (baseCalculo === 'SobreValorLiquido' ? 'valorTotalComDesconto' : 'valorPagoParaCedenteParcial');
    const origemCedente = origem(contrato.cedenteBaseCalculo);
    const origemNotaFiscal = origem(contrato.notaFiscalBaseCalculo);

    m.titulo('4) Bases de cálculo');
    m.regra(`cedenteBaseCalculo = ${contrato.cedenteBaseCalculo} → usa ${origemCedente}`);
    m.formula('valorBaseCalculoCedente', origemCedente, moeda(r.valorBaseCalculoCedente), r.valorBaseCalculoCedente);
    m.regra(`notaFiscalBaseCalculo = ${contrato.notaFiscalBaseCalculo} → usa ${origemNotaFiscal}`);
    m.formula('valorBaseCalculoNotaFiscal', origemNotaFiscal, moeda(r.valorBaseCalculoNotaFiscal), r.valorBaseCalculoNotaFiscal);
}

function etapaEmissaoNotaFiscal(m: MemoriaCalculo, contrato: ContratoCalculo, r: ResultadoCalculo) {
    m.titulo('5) Valor de emissão da nota fiscal');
    m.regra(`notaFiscalTipoEmissao = ${contrato.notaFiscalTipoEmissao}`);

    if (contrato.notaFiscalTipoEmissao !== 'NaoSeAplica') {
        m.formula('valorEmissaoNotaFiscal', 'valorBaseCalculoNotaFiscal × notaFiscalPercentualEmissao / 100',
            `${moeda(r.valorBaseCalculoNotaFiscal)} × ${numero(contrato.notaFiscalPercentualEmissao)} / 100`, r.valorEmissaoNotaFiscal);
    } else {
        m.formula('valorEmissaoNotaFiscal', '0', moeda(0), r.valorEmissaoNotaFiscal);
    }
}

function etapaPagamentoContratada(m: MemoriaCalculo, entrada: DadosEntradaCalculo, contrato: ContratoCalculo, r: ResultadoCalculo) {
    const negociacao = numero(contrato.cedenteValorNegociacao);
    const baseCedente = moeda(r.valorBaseCalculoCedente);
    const credito = numero(entrada.creditoUtilizado);

    m.titulo('6) Valor a ser pago para a contratada');
    m.regra(`cedenteTipoNegociacao = ${contrato.cedenteTipoNegociacao}`);

    let valorNegociacao: number;
    if (contrato.cedenteTipoNegociacao === 'Fixo') {
        valorNegociacao = r.valorBaseCalculoCedente - entrada.creditoUtilizado * (contrato.cedenteValorNegociacao ?? 0);
        m.formula('valorPagoParaContratada', 'valorBaseCalculoCedente - creditoUtilizado × cedenteValorNegociacao',
            `${baseCedente} - ${credito} × ${negociacao}`, valorNegociacao);
    } else if (contrato.cedenteTipoNegociacao === 'Percentual') {
        valorNegociacao = (r.valorBaseCalculoCedente * (100 - contrato.cedenteValorNegociacao)) / 100;
        m.formula('valorPagoParaContratada', 'valorBaseCalculoCedente × (100 - cedenteValorNegociacao) / 100',
            `${baseCedente} × (100 - ${negociacao}) / 100`, valorNegociacao);
    } else {
        const cedenteValorNegociacaoCalculado = ((r.valorTotalSemDesconto / 100) * contrato.cedenteValorNegociacao) / entrada.creditoUtilizado;
        valorNegociacao = r.valorBaseCalculoCedente - entrada.creditoUtilizado * (cedenteValorNegociacaoCalculado ?? 0);
        m.formula('cedenteValorNegociacaoCalculado', '(valorTotalSemDesconto / 100) × cedenteValorNegociacao / creditoUtilizado',
            `(${moeda(r.valorTotalSemDesconto)} / 100) × ${negociacao} / ${credito}`, cedenteValorNegociacaoCalculado, numero);
        m.formula('valorPagoParaContratada', 'valorBaseCalculoCedente - creditoUtilizado × cedenteValorNegociacaoCalculado',
            `${baseCedente} - ${credito} × ${numero(cedenteValorNegociacaoCalculado)}`, valorNegociacao);
    }

    const emissao = moeda(r.valorEmissaoNotaFiscal);
    m.regra(`notaFiscalTipoEmissao = ${contrato.notaFiscalTipoEmissao}`);

    switch (contrato.notaFiscalTipoEmissao) {
        case 'EmissaoCompartilhadaCusto220': {
            const valorCompartilhadoCustoCedente = (r.valorEmissaoNotaFiscal * contrato.cedenteValorNegociacao) / 100;
            m.formula('valorCompartilhadoCustoCedente', 'valorEmissaoNotaFiscal × cedenteValorNegociacao / 100',
                `${emissao} × ${negociacao} / 100`, valorCompartilhadoCustoCedente);
            m.formula('valorPagoParaContratada', 'valorPagoParaContratada + valorCompartilhadoCustoCedente',
                `${moeda(valorNegociacao)} + ${moeda(valorCompartilhadoCustoCedente)}`, r.valorPagoParaContratada);
            break;
        }
        case 'EmissaoCompartilhadaCustoCedente': {
            const valorCompartilhadoCusto220 = (r.valorEmissaoNotaFiscal * (100 - contrato.cedenteValorNegociacao)) / 100;
            m.formula('valorCompartilhadoCusto220', 'valorEmissaoNotaFiscal × (100 - cedenteValorNegociacao) / 100',
                `${emissao} × (100 - ${negociacao}) / 100`, valorCompartilhadoCusto220);
            m.formula('valorPagoParaContratada', 'valorPagoParaContratada - valorCompartilhadoCusto220',
                `${moeda(valorNegociacao)} - ${moeda(valorCompartilhadoCusto220)}`, r.valorPagoParaContratada);
            break;
        }
        default:
            m.formula('valorPagoParaContratada', 'valorPagoParaContratada + valorEmissaoNotaFiscal',
                `${moeda(valorNegociacao)} + ${emissao}`, r.valorPagoParaContratada);
            break;
    }
}

function etapaTotaisEconomia(m: MemoriaCalculo, entrada: DadosEntradaCalculo, r: ResultadoCalculo) {
    m.titulo('7) Totais pagos e economia');
    m.formula('valorTotalPagoComCreditos', 'valorCpfl + valorPagoParaCedenteParcial',
        `${moeda(entrada.valorCpfl)} + ${moeda(r.valorPagoParaCedenteParcial)}`, r.valorTotalPagoComCreditos);
    m.formula('valorTotalPagoSemCreditos', 'energiaConsumidaValorTusdAtiva + energiaConsumidaValorTeAtiva + ipCipEncargos + energiaConsumidaBandeira',
        `${moeda(entrada.energiaConsumidaValorTusdAtiva)} + ${moeda(entrada.energiaConsumidaValorTeAtiva)} + ${moeda(entrada.ipCipEncargos)} + ${moeda(entrada.energiaConsumidaBandeira)}`,
        r.valorTotalPagoSemCreditos);
    m.formula('valorEconomia', 'valorTotalPagoSemCreditos - valorTotalPagoComCreditos',
        `${moeda(r.valorTotalPagoSemCreditos)} - ${moeda(r.valorTotalPagoComCreditos)}`, r.valorEconomia);
}

function etapaNotaFiscalCedente(m: MemoriaCalculo, contrato: ContratoCalculo, r: ResultadoCalculo) {
    m.titulo('8) Valor de emissão da nota fiscal absorvido pelo cedente');
    m.regra(`notaFiscalTipoEmissao = ${contrato.notaFiscalTipoEmissao}`);

    if (contrato.notaFiscalTipoEmissao === 'EmissaoCedente') {
        m.formula('valorEmissaoNotaFiscalCedente', 'valorEmissaoNotaFiscal × cedenteValorNegociacao / 100',
            `${moeda(r.valorEmissaoNotaFiscal)} × ${numero(contrato.cedenteValorNegociacao)} / 100`, r.valorEmissaoNotaFiscalCedente);
    } else {
        m.formula('valorEmissaoNotaFiscalCedente', '0', moeda(0), r.valorEmissaoNotaFiscalCedente);
    }
}

function etapaPagamentoCedente(m: MemoriaCalculo, entrada: DadosEntradaCalculo, contrato: ContratoCalculo, r: ResultadoCalculo) {
    m.titulo('9) Valor final a ser pago ao cedente');
    m.regra(`flagValorContaEnergiaInclusoNoPagamentoAoCedente = ${simNao(contrato.flagValorContaEnergiaInclusoNoPagamentoAoCedente)}`);

    if (contrato.flagValorContaEnergiaInclusoNoPagamentoAoCedente) {
        m.formula('valorPagoParaCedente', 'valorPagoParaCedenteParcial + valorEmissaoNotaFiscalCedente + valorCpfl',
            `${moeda(r.valorPagoParaCedenteParcial)} + ${moeda(r.valorEmissaoNotaFiscalCedente)} + ${moeda(entrada.valorCpfl)}`, r.valorPagoParaCedente);
    } else {
        m.formula('valorPagoParaCedente', 'valorPagoParaCedenteParcial + valorEmissaoNotaFiscalCedente',
            `${moeda(r.valorPagoParaCedenteParcial)} + ${moeda(r.valorEmissaoNotaFiscalCedente)}`, r.valorPagoParaCedente);
    }
}

function etapaResultadoFinal(m: MemoriaCalculo, r: ResultadoCalculo) {
    m.titulo('=== Resultado Final ===');
    m.variaveis([
        ['valorTotalSemDesconto', moeda(r.valorTotalSemDesconto), 'Valor Total sem Desconto'],
        ['valorDesconto', moeda(r.valorDesconto), 'Desconto'],
        ['valorTotalComDesconto', moeda(r.valorTotalComDesconto), 'Valor Total com Desconto'],
        ['valorPagoParaCedente', moeda(r.valorPagoParaCedente), 'Valor a ser pago para o Cedente'],
        ['valorEmissaoNotaFiscal', moeda(r.valorEmissaoNotaFiscal), 'Valor de Emissão da Nota Fiscal'],
        ['valorPagoParaContratada', moeda(r.valorPagoParaContratada), 'Valor a ser pago para a Contratada'],
        ['valorTotalPagoComCreditos', moeda(r.valorTotalPagoComCreditos), 'Valor Total Pago com Créditos'],
        ['valorTotalPagoSemCreditos', moeda(r.valorTotalPagoSemCreditos), 'Valor Total Pago sem Créditos'],
        ['valorEconomia', moeda(r.valorEconomia), 'Economia']
    ]);
}
