import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContratoService } from '@/app/services/contrato.service';
import { debounceTime, merge } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TipoNegociacaoService } from '@/app/services/tipo-negociacao.service';
import { StatusContratoService } from '@/app/services/status-contrato.service';
import { BandeiraTipoCobrancaService } from '@/app/services/bandeira-tipo-cobranca.service';
import { BaseCalculoService } from '@/app/services/base-calculo.service';
import { NotaFiscalTipoEmissaoService } from '@/app/services/nota-fiscal-tipo-emissao.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MovimentoService } from '@/app/services/movimento.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-movimento-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, InputNumberModule, DatePickerModule, SelectModule, InputMaskModule, ButtonModule, TagModule, TextareaModule, DialogModule],
    styleUrl: './movimento-form.scss',
    templateUrl: './movimento-form.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [TipoNegociacaoService, StatusContratoService, BandeiraTipoCobrancaService, BaseCalculoService, NotaFiscalTipoEmissaoService]
})
export class MovimentoForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly contratoService = inject(ContratoService);
    private readonly movimentoService = inject(MovimentoService);
    private readonly tipoNegociacaoService = inject(TipoNegociacaoService);
    private readonly statusContratoService = inject(StatusContratoService);
    private readonly bandeiraTipoCobrancaService = inject(BandeiraTipoCobrancaService);
    private readonly baseCalculoService = inject(BaseCalculoService);
    private readonly notaFiscalTipoEmissaoService = inject(NotaFiscalTipoEmissaoService);

    editando = signal<boolean>(false);
    salvando = signal<boolean>(false);
    carregando = signal<boolean>(false);
    contratos = signal<any[]>([]);
    tiposNegociacao = signal<any[]>([]);
    statusContrato = signal<any[]>([]);
    bandeirasTipoCobranca = signal<any[]>([]);
    basesCalculo = signal<any[]>([]);
    tiposNotaFiscalEmissao = signal<any[]>([]);

    contratoIdSelecionado = signal<string>('');
    contratoSelecionado = signal<any>(null);
    contratoResumo = computed(() => this.contratos().find((c) => c.id === this.contratoIdSelecionado()) ?? null);

    memoriaCalculoVisivel = signal<boolean>(false);
    memoriaCalculoTexto = signal<string>('');

    form = this.fb.nonNullable.group({
        contratoId: ['', Validators.required],
        mesAnoReferencia: ['', [Validators.required, Validators.maxLength(7)]],
        dataInicialPeriodo: this.fb.control<Date | null>(null, Validators.required),
        dataFinalPeriodo: this.fb.control<Date | null>(null, Validators.required),
        dataLimitePagamentoConta: this.fb.control<Date | null>(null, Validators.required),
        dataLimitePagamentoCedente: this.fb.control<Date | null>(null, Validators.required),
        dataLimitePagamentoContratada: this.fb.control<Date | null>(null, Validators.required),
        creditoUtilizado: [0],
        energiaConsumidaValorTusdAtiva: [0],
        energiaConsumidaValorTeAtiva: [0],
        energiaConsumidaBandeira: [0],
        ipCipEncargos: [0],
        creditoUtilizadoValorTusdInjetada: [0],
        creditoUtilizadoValorTeInjetada: [0],
        creditoUtilizadoBandeira: [0],
        valorTotalSemDesconto: [{ value: 0, disabled: true }],
        valorDesconto: [{ value: 0, disabled: true }],
        valorTotalComDesconto: [{ value: 0, disabled: true }],
        valorCpfl: [0],
        valorPagoParaCedente: [{ value: 0, disabled: true }],
        valorEmissaoNotaFiscal: [{ value: 0, disabled: true }],
        valorPagoParaContratada: [{ value: 0, disabled: true }],
        valorTotalPagoComCreditos: [{ value: 0, disabled: true }],
        valorTotalPagoSemCreditos: [{ value: 0, disabled: true }],
        valorEconomia: [{ value: 0, disabled: true }],
        saldoRestante: [0]
    });

    private movimentoId: string | null = null;

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly messageService: MessageService
    ) {}

    private readonly camposDadosParaCalculos = [
        'creditoUtilizado',
        'energiaConsumidaValorTusdAtiva',
        'energiaConsumidaValorTeAtiva',
        'energiaConsumidaBandeira',
        'ipCipEncargos',
        'creditoUtilizadoValorTusdInjetada',
        'creditoUtilizadoValorTeInjetada',
        'creditoUtilizadoBandeira',
        'valorCpfl'
    ] as const;

    ngOnInit() {
        this.movimentoId = this.route.snapshot.paramMap.get('id');
        this.editando.set(!!this.movimentoId);

        this.tiposNegociacao.set(this.tipoNegociacaoService.listar());
        this.statusContrato.set(this.statusContratoService.listar());
        this.bandeirasTipoCobranca.set(this.bandeiraTipoCobrancaService.listar());
        this.basesCalculo.set(this.baseCalculoService.listar());
        this.tiposNotaFiscalEmissao.set(this.notaFiscalTipoEmissaoService.listar());
        this.carregarContratos();

        merge(...this.camposDadosParaCalculos.map((campo) => this.form.controls[campo].valueChanges))
            .pipe(debounceTime(500))
            .subscribe(() => this.calcular());

        this.form.controls.contratoId.valueChanges.subscribe((id) => {
            this.contratoIdSelecionado.set(id);
            this.obterContratoSelecionado(id);
        });

        if (this.movimentoId) {
            this.carregarMovimento(this.movimentoId);
        }
    }

    private carregarMovimento(id: string) {
        this.carregando.set(true);

        this.movimentoService.obter(id).subscribe({
            next: (resposta) => {
                if (resposta.items) {
                    this.preencherFormulario(resposta.items);
                }
                this.carregando.set(false);
            },
            error: () => this.carregando.set(false)
        });
    }

    preencherFormulario(movimento: any) {
        this.form.patchValue({
            contratoId: movimento.contratoId,
            mesAnoReferencia: movimento.mesAnoReferencia ?? '',
            dataInicialPeriodo: this.paraData(movimento.dataInicialPeriodo),
            dataFinalPeriodo: this.paraData(movimento.dataFinalPeriodo),
            dataLimitePagamentoConta: this.paraData(movimento.dataLimitePagamentoConta),
            dataLimitePagamentoCedente: this.paraData(movimento.dataLimitePagamentoCedente),
            dataLimitePagamentoContratada: this.paraData(movimento.dataLimitePagamentoContratada),
            creditoUtilizado: movimento.creditoUtilizado,
            energiaConsumidaValorTusdAtiva: movimento.energiaConsumidaValorTusdAtiva,
            energiaConsumidaValorTeAtiva: movimento.energiaConsumidaValorTeAtiva,
            energiaConsumidaBandeira: movimento.energiaConsumidaBandeira,
            ipCipEncargos: movimento.ipCipEncargos,
            creditoUtilizadoValorTusdInjetada: movimento.creditoUtilizadoValorTusdInjetada,
            creditoUtilizadoValorTeInjetada: movimento.creditoUtilizadoValorTeInjetada,
            creditoUtilizadoBandeira: movimento.creditoUtilizadoBandeira,
            valorTotalSemDesconto: movimento.valorTotalSemDesconto,
            valorDesconto: movimento.valorDesconto,
            valorTotalComDesconto: movimento.valorTotalComDesconto,
            valorCpfl: movimento.valorCpfl,
            valorPagoParaCedente: movimento.valorPagoParaCedente,
            valorEmissaoNotaFiscal: movimento.valorEmissaoNotaFiscal ?? null,
            valorPagoParaContratada: movimento.valorPagoParaContratada,
            valorTotalPagoComCreditos: movimento.valorTotalPagoComCreditos,
            valorTotalPagoSemCreditos: movimento.valorTotalPagoSemCreditos,
            valorEconomia: movimento.valorEconomia,
            saldoRestante: movimento.saldoRestante
        });
    }

    private carregarContratos() {
        this.contratoService.listar().subscribe({
            next: (resposta) => {
                const items = resposta.items ?? [];
                this.contratos.set(
                    items.map((contrato: any) => ({
                        ...contrato,
                        descricaoSelecao: `${contrato.cedente?.nome ?? '?'} (UC ${contrato.cedenteNumeroUc ?? '?'}) → ${contrato.beneficiario?.nome ?? '?'} (UC ${contrato.beneficiarioNumeroUc ?? '?'})`
                    }))
                );
            }
        });
    }

    private obterContratoSelecionado(id: string) {
        if (!id) {
            this.contratoSelecionado.set(null);
            return;
        }

        this.contratoService.obter(id).subscribe({
            next: (resposta) => {
                this.contratoSelecionado.set(resposta.items ?? null);
                this.calcular();
            }
        });
    }

    descricao(lista: any[], id: string): string {
        return lista.find((item) => item.id === id)?.descricao ?? id;
    }

    private paraData(valor: string): Date {
        const [ano, mes, dia] = valor.split('-').map(Number);
        return new Date(ano, mes - 1, dia);
    }

    private paraTexto(data: Date): string {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }

    private voltarParaListagem() {
        this.router.navigate(['/pages/movimentos']);
    }

    private aoSalvarComSucesso(mensagem: string | undefined) {
        this.salvando.set(false);
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: mensagem ?? 'Movimento salvo com sucesso.', life: 3000 });
        this.voltarParaListagem();
    }

    private moeda(valor: number | null | undefined): string {
        return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    abrirMemoriaCalculo() {
        this.memoriaCalculoVisivel.set(true);
    }

    calcular() {
        const contrato = this.contratoSelecionado();

        if (contrato === null) {
            return;
        }

        const formValue = this.form.getRawValue();
        const moeda = (valor: number | null | undefined) => this.moeda(valor);
        const passos: string[] = [];

        passos.push('1) Dados de entrada do formulário');
        passos.push(`   - Créditos utilizados: ${formValue.creditoUtilizado} kWh`);
        passos.push(`   - Valor TUSD Ativa (Energia Consumida): ${moeda(formValue.energiaConsumidaValorTusdAtiva)}`);
        passos.push(`   - Valor TE Ativa (Energia Consumida): ${moeda(formValue.energiaConsumidaValorTeAtiva)}`);
        passos.push(`   - Bandeira (Energia Consumida): ${moeda(formValue.energiaConsumidaBandeira)}`);
        passos.push(`   - IP-CIP / Encargos: ${moeda(formValue.ipCipEncargos)}`);
        passos.push(`   - Valor TUSD Injetada (Crédito Utilizado): ${moeda(formValue.creditoUtilizadoValorTusdInjetada)}`);
        passos.push(`   - Valor TE Injetada (Crédito Utilizado): ${moeda(formValue.creditoUtilizadoValorTeInjetada)}`);
        passos.push(`   - Bandeira (Crédito Utilizado): ${moeda(formValue.creditoUtilizadoBandeira)}`);
        passos.push(`   - Valor CPFL: ${moeda(formValue.valorCpfl)}`);
        passos.push('');
        passos.push('2) Dados do contrato utilizados no cálculo');
        passos.push(`   - Bandeira Tipo Cobrança: ${contrato.bandeiraTipoCobranca}`);
        passos.push(`   - Percentual de Desconto do Beneficiário: ${contrato.beneficiarioPercentualDesconto ?? 0}%`);
        passos.push(`   - Base de Cálculo do Cedente: ${contrato.cedenteBaseCalculo}`);
        passos.push(`   - Base de Cálculo da Nota Fiscal: ${contrato.notaFiscalBaseCalculo}`);
        passos.push(`   - Tipo de Emissão da Nota Fiscal: ${contrato.notaFiscalTipoEmissao}`);
        passos.push(`   - Percentual de Emissão da Nota Fiscal: ${contrato.notaFiscalPercentualEmissao ?? 0}%`);
        passos.push(`   - Tipo de Negociação do Cedente: ${contrato.cedenteTipoNegociacao}`);
        passos.push(`   - Valor de Negociação do Cedente: ${contrato.cedenteValorNegociacao}`);
        passos.push(`   - Valor conta energia incluso no pagamento ao cedente: ${contrato.flagValorContaEnergiaInclusoNoPagamentoAoCedente ? 'Sim' : 'Não'}`);
        passos.push('');

        let valorTotalSemDesconto = 0;
        let valorDesconto = 0;
        let valorTotalComDesconto = 0;
        let valorPagoParaCedente = 0;
        let valorPagoParaContratada = 0;

        passos.push('3) Valor total sem desconto, desconto e valor pago ao cedente (conforme bandeira tipo cobrança)');
        if (contrato.bandeiraTipoCobranca === 'BandeiraAntesDoDesconto') {
            passos.push('   Regra aplicada: BandeiraAntesDoDesconto');
            valorTotalSemDesconto = formValue.creditoUtilizadoValorTusdInjetada + formValue.creditoUtilizadoValorTeInjetada + formValue.creditoUtilizadoValorTeInjetada;
            passos.push(`   valorTotalSemDesconto = TUSD Injetada + TE Injetada + TE Injetada = ${moeda(formValue.creditoUtilizadoValorTusdInjetada)} + ${moeda(formValue.creditoUtilizadoValorTeInjetada)} + ${moeda(formValue.creditoUtilizadoValorTeInjetada)} = ${moeda(valorTotalSemDesconto)}`);

            valorDesconto = (valorTotalSemDesconto * (contrato.beneficiarioPercentualDesconto ?? 0)) / 100;
            passos.push(`   valorDesconto = valorTotalSemDesconto × percentualDesconto / 100 = ${moeda(valorTotalSemDesconto)} × ${contrato.beneficiarioPercentualDesconto ?? 0}% = ${moeda(valorDesconto)}`);

            valorTotalComDesconto = valorTotalSemDesconto - valorDesconto;
            passos.push(`   valorTotalComDesconto = valorTotalSemDesconto - valorDesconto = ${moeda(valorTotalSemDesconto)} - ${moeda(valorDesconto)} = ${moeda(valorTotalComDesconto)}`);

            valorPagoParaCedente = valorTotalSemDesconto - valorDesconto;
            passos.push(`   valorPagoParaCedente = valorTotalSemDesconto - valorDesconto = ${moeda(valorPagoParaCedente)}`);
        } else if (contrato.bandeiraTipoCobranca === 'BandeiraAposDesconto') {
            passos.push('   Regra aplicada: BandeiraAposDesconto');
            valorTotalSemDesconto = formValue.creditoUtilizadoValorTusdInjetada + formValue.creditoUtilizadoValorTeInjetada;
            passos.push(`   valorTotalSemDesconto = TUSD Injetada + TE Injetada = ${moeda(formValue.creditoUtilizadoValorTusdInjetada)} + ${moeda(formValue.creditoUtilizadoValorTeInjetada)} = ${moeda(valorTotalSemDesconto)}`);

            valorDesconto = (valorTotalSemDesconto * (contrato.beneficiarioPercentualDesconto ?? 0)) / 100;
            passos.push(`   valorDesconto = valorTotalSemDesconto × percentualDesconto / 100 = ${moeda(valorTotalSemDesconto)} × ${contrato.beneficiarioPercentualDesconto ?? 0}% = ${moeda(valorDesconto)}`);

            valorTotalComDesconto = valorTotalSemDesconto - valorDesconto;
            passos.push(`   valorTotalComDesconto = valorTotalSemDesconto - valorDesconto = ${moeda(valorTotalSemDesconto)} - ${moeda(valorDesconto)} = ${moeda(valorTotalComDesconto)}`);

            valorPagoParaCedente = valorTotalSemDesconto - valorDesconto + formValue.creditoUtilizadoBandeira;
            passos.push(`   valorPagoParaCedente = valorTotalComDesconto + Bandeira (Crédito Utilizado) = ${moeda(valorTotalComDesconto)} + ${moeda(formValue.creditoUtilizadoBandeira)} = ${moeda(valorPagoParaCedente)}`);
        } else {
            passos.push(`   Regra aplicada: ${contrato.bandeiraTipoCobranca} (padrão)`);
            valorTotalSemDesconto = formValue.creditoUtilizadoValorTusdInjetada + formValue.creditoUtilizadoValorTeInjetada;
            passos.push(`   valorTotalSemDesconto = TUSD Injetada + TE Injetada = ${moeda(formValue.creditoUtilizadoValorTusdInjetada)} + ${moeda(formValue.creditoUtilizadoValorTeInjetada)} = ${moeda(valorTotalSemDesconto)}`);

            valorDesconto = (valorTotalSemDesconto * (contrato.beneficiarioPercentualDesconto ?? 0)) / 100;
            passos.push(`   valorDesconto = valorTotalSemDesconto × percentualDesconto / 100 = ${moeda(valorTotalSemDesconto)} × ${contrato.beneficiarioPercentualDesconto ?? 0}% = ${moeda(valorDesconto)}`);

            valorTotalComDesconto = valorTotalSemDesconto - valorDesconto;
            passos.push(`   valorTotalComDesconto = valorTotalSemDesconto - valorDesconto = ${moeda(valorTotalSemDesconto)} - ${moeda(valorDesconto)} = ${moeda(valorTotalComDesconto)}`);

            valorPagoParaCedente = valorTotalSemDesconto - valorDesconto + formValue.creditoUtilizadoValorTeInjetada;
            passos.push(`   valorPagoParaCedente = valorTotalComDesconto + TE Injetada = ${moeda(valorTotalComDesconto)} + ${moeda(formValue.creditoUtilizadoValorTeInjetada)} = ${moeda(valorPagoParaCedente)}`);

            valorPagoParaContratada = formValue.creditoUtilizadoValorTeInjetada;
            passos.push(`   valorPagoParaContratada (parcial) = TE Injetada = ${moeda(valorPagoParaContratada)}`);
        }
        passos.push('');

        //Definição das bases de cálculos para o registro do Movimento
        const valorBaseCalculoCedente = contrato.cedenteBaseCalculo === 'SobreValorLiquido'
            ? valorTotalComDesconto
            : valorPagoParaCedente;

        const valorBaseCalculoNotaFiscal = contrato.notaFiscalBaseCalculo === 'SobreValorLiquido'
            ? valorTotalComDesconto
            : valorPagoParaCedente;

        passos.push('4) Bases de cálculo (cedente e nota fiscal)');
        passos.push(`   valorBaseCalculoCedente = (${contrato.cedenteBaseCalculo} === 'SobreValorLiquido' ? valorTotalComDesconto : valorPagoParaCedente) = ${moeda(valorBaseCalculoCedente)}`);
        passos.push(`   valorBaseCalculoNotaFiscal = (${contrato.notaFiscalBaseCalculo} === 'SobreValorLiquido' ? valorTotalComDesconto : valorPagoParaCedente) = ${moeda(valorBaseCalculoNotaFiscal)}`);
        passos.push('');

        //Apurar Valor Nota Fiscal
        let valorEmissaoNotaFiscal;
        passos.push('5) Valor de emissão da nota fiscal');
        switch (contrato.notaFiscalTipoEmissao) {
            case 'NaoSeAplica':
                valorEmissaoNotaFiscal = 0;
                passos.push(`   Tipo de emissão = NaoSeAplica → valorEmissaoNotaFiscal = ${moeda(valorEmissaoNotaFiscal)}`);
                break;
            case 'Emissao220':
            case 'EmissaoCedente':
            case 'EmissaoCompartilhada':
                valorEmissaoNotaFiscal = (valorBaseCalculoNotaFiscal * contrato.notaFiscalPercentualEmissao) / 100;
                passos.push(`   Tipo de emissão = ${contrato.notaFiscalTipoEmissao} → valorEmissaoNotaFiscal = valorBaseCalculoNotaFiscal × percentualEmissao / 100 = ${moeda(valorBaseCalculoNotaFiscal)} × ${contrato.notaFiscalPercentualEmissao}% = ${moeda(valorEmissaoNotaFiscal)}`);
                break;
            default:
                valorEmissaoNotaFiscal = 0;
                passos.push(`   Tipo de emissão não reconhecido (${contrato.notaFiscalTipoEmissao}) → valorEmissaoNotaFiscal = ${moeda(valorEmissaoNotaFiscal)}`);
                break;
        }
        passos.push('');

        //Apurar Valor Pago Para Contratada
        passos.push('6) Valor a ser pago para a contratada');
        const valorPagoParaContratadaAntes = valorPagoParaContratada;
        if (contrato.cedenteTipoNegociacao === 'Fixo') {
            const valorCreditoNegociado = formValue.creditoUtilizado * (contrato.cedenteValorNegociacao ?? 0);
            const incremento = valorBaseCalculoCedente - valorCreditoNegociado + valorEmissaoNotaFiscal;
            valorPagoParaContratada += incremento;
            passos.push(`   Negociação Fixo → incremento = valorBaseCalculoCedente - (créditoUtilizado × valorNegociação) + valorEmissaoNotaFiscal`,
                `                   = ${moeda(valorBaseCalculoCedente)} - (${formValue.creditoUtilizado} × ${contrato.cedenteValorNegociacao ?? 0}) + ${moeda(valorEmissaoNotaFiscal)}`,
                `                   = ${moeda(valorBaseCalculoCedente)} - ${moeda(valorCreditoNegociado)} + ${moeda(valorEmissaoNotaFiscal)} = ${moeda(incremento)}`);
        } else if (contrato.notaFiscalTipoEmissao == 'NaoSeAplica' || contrato.notaFiscalTipoEmissao == 'EmissaoCedente') {
            const incremento = (valorBaseCalculoCedente * (100 - contrato.cedenteValorNegociacao)) / 100;
            valorPagoParaContratada += incremento;
            passos.push(`   Negociação percentual, NF ${contrato.notaFiscalTipoEmissao} → incremento = valorBaseCalculoCedente × (100 - valorNegociação) / 100`,
                `                   = ${moeda(valorBaseCalculoCedente)} × (100 - ${contrato.cedenteValorNegociacao}) / 100 = ${moeda(incremento)}`);
        } else if (contrato.notaFiscalTipoEmissao == 'Emissao220') {
            const parte1 = (valorBaseCalculoCedente * (100 - contrato.cedenteValorNegociacao)) / 100;
            const parte2 = (valorEmissaoNotaFiscal * (100 - contrato.cedenteValorNegociacao)) / 100;
            valorPagoParaContratada += parte1 + parte2;
            passos.push(`   Negociação percentual, NF Emissao220 → incremento = (valorBaseCalculoCedente × (100 - valorNegociação) / 100) + (valorEmissaoNotaFiscal × (100 - valorNegociação) / 100)`,
                `                   = (${moeda(valorBaseCalculoCedente)} × (100 - ${contrato.cedenteValorNegociacao}) / 100) + (${moeda(valorEmissaoNotaFiscal)} × (100 - ${contrato.cedenteValorNegociacao}) / 100)`,
                `                   = ${moeda(parte1)} + ${moeda(parte2)} = ${moeda(parte1 + parte2)}`);
        } else {
            const incremento = (valorBaseCalculoCedente * (100 - contrato.cedenteValorNegociacao)) / 100;
            const valorEmissaoNotaFiscal220 = (valorEmissaoNotaFiscal * contrato.cedenteValorNegociacao) / 100;
            valorPagoParaContratada += incremento + valorEmissaoNotaFiscal220;
            passos.push(`   Negociação percentual, NF ${contrato.notaFiscalTipoEmissao} → incremento = (valorBaseCalculoCedente × (100 - valorNegociação) / 100) + (valorEmissaoNotaFiscal × valorNegociação / 100)`,
                `                   = (${moeda(valorBaseCalculoCedente)} × (100 - ${contrato.cedenteValorNegociacao}) / 100) + (${moeda(valorEmissaoNotaFiscal)} × ${contrato.cedenteValorNegociacao} / 100)`,
                `                   = ${moeda(incremento)} + ${moeda(valorEmissaoNotaFiscal220)} = ${moeda(incremento + valorEmissaoNotaFiscal220)}`);
        }
        passos.push(`   valorPagoParaContratada = valorPagoParaContratada (parcial) + incremento = ${moeda(valorPagoParaContratadaAntes)} + ${moeda(valorPagoParaContratada - valorPagoParaContratadaAntes)} = ${moeda(valorPagoParaContratada)}`);
        passos.push('');

        const valorTotalPagoComCreditos = formValue.valorCpfl + valorPagoParaCedente;
        const valorTotalPagoSemCreditos = formValue.energiaConsumidaValorTusdAtiva + formValue.energiaConsumidaValorTeAtiva + formValue.ipCipEncargos + formValue.energiaConsumidaBandeira;
        const valorEconomia = valorTotalPagoSemCreditos - valorTotalPagoComCreditos;

        passos.push('7) Totais pagos e economia');
        passos.push(`   valorTotalPagoComCreditos = valorCpfl + valorPagoParaCedente = ${moeda(formValue.valorCpfl)} + ${moeda(valorPagoParaCedente)} = ${moeda(valorTotalPagoComCreditos)}`);
        passos.push(`   valorTotalPagoSemCreditos = TUSD Ativa + TE Ativa + IP-CIP/Encargos + Bandeira (Consumida) = ${moeda(formValue.energiaConsumidaValorTusdAtiva)} + ${moeda(formValue.energiaConsumidaValorTeAtiva)} + ${moeda(formValue.ipCipEncargos)} + ${moeda(formValue.energiaConsumidaBandeira)} = ${moeda(valorTotalPagoSemCreditos)}`);
        passos.push(`   valorEconomia = valorTotalPagoSemCreditos - valorTotalPagoComCreditos = ${moeda(valorTotalPagoSemCreditos)} - ${moeda(valorTotalPagoComCreditos)} = ${moeda(valorEconomia)}`);
        passos.push('');

        const valorEmissaoNotaFiscalCedente = contrato.notaFiscalTipoEmissao == 'EmissaoCedente'
            ? (valorEmissaoNotaFiscal * contrato.cedenteValorNegociacao) / 100
            : 0;

        passos.push('8) Valor de emissão de nota fiscal absorvido pelo cedente');
        passos.push(`   valorEmissaoNotaFiscalCedente = (tipoEmissao === 'EmissaoCedente' ? valorEmissaoNotaFiscal × valorNegociação / 100 : 0) = ${moeda(valorEmissaoNotaFiscalCedente)}`);
        passos.push('');

        //Apurar Valor Final Pago Para Cedente
        const valorPagoParaCedenteAntes = valorPagoParaCedente;
        valorPagoParaCedente = contrato.flagValorContaEnergiaInclusoNoPagamentoAoCedente
            ? valorPagoParaCedente + valorEmissaoNotaFiscalCedente + formValue.valorCpfl
            : valorPagoParaCedente + valorEmissaoNotaFiscalCedente;

        passos.push('9) Valor final a ser pago ao cedente');
        if (contrato.flagValorContaEnergiaInclusoNoPagamentoAoCedente) {
            passos.push(`   Conta de energia inclusa no pagamento → valorPagoParaCedente = valorPagoParaCedente + valorEmissaoNotaFiscalCedente + valorCpfl`);
            passos.push(`                                          = ${moeda(valorPagoParaCedenteAntes)} + ${moeda(valorEmissaoNotaFiscalCedente)} + ${moeda(formValue.valorCpfl)} = ${moeda(valorPagoParaCedente)}`);
        } else {
            passos.push(`   Conta de energia NÃO inclusa no pagamento → valorPagoParaCedente = valorPagoParaCedente + valorEmissaoNotaFiscalCedente`);
            passos.push(`                                                = ${moeda(valorPagoParaCedenteAntes)} + ${moeda(valorEmissaoNotaFiscalCedente)} = ${moeda(valorPagoParaCedente)}`);
        }
        passos.push('');
        passos.push('=== Resultado Final ===');
        passos.push(`   Valor Total sem Desconto: ${moeda(valorTotalSemDesconto)}`);
        passos.push(`   Desconto: ${moeda(valorDesconto)}`);
        passos.push(`   Valor Total com Desconto: ${moeda(valorTotalComDesconto)}`);
        passos.push(`   Valor a ser pago para o Cedente: ${moeda(valorPagoParaCedente)}`);
        passos.push(`   Valor de Emissão da Nota Fiscal: ${moeda(valorEmissaoNotaFiscal)}`);
        passos.push(`   Valor a ser pago para a Contratada: ${moeda(valorPagoParaContratada)}`);
        passos.push(`   Valor Total Pago com Créditos: ${moeda(valorTotalPagoComCreditos)}`);
        passos.push(`   Valor Total Pago sem Créditos: ${moeda(valorTotalPagoSemCreditos)}`);
        passos.push(`   Economia: ${moeda(valorEconomia)}`);

        this.memoriaCalculoTexto.set(passos.join('\n'));

        this.form.patchValue(
            {
                valorTotalSemDesconto,
                valorDesconto,
                valorTotalComDesconto,
                valorPagoParaCedente,
                valorEmissaoNotaFiscal,
                valorPagoParaContratada,
                valorTotalPagoComCreditos,
                valorTotalPagoSemCreditos,
                valorEconomia
            },
            { emitEvent: false }
        );
    }

    salvar() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.salvando.set(true);

        if (this.editando()) {
            this.movimentoService.atualizar(this.montarRequestAtualizar()).subscribe({
                next: (resposta) => this.aoSalvarComSucesso(resposta.items?.mensagem),
                error: () => this.salvando.set(false)
            });
        } else {
            this.movimentoService.adicionar(this.montarRequestAdicionar()).subscribe({
                next: (resposta) => this.aoSalvarComSucesso(resposta.items?.mensagem),
                error: () => this.salvando.set(false)
            });
        }
    }

    private dadosComuns() {
        const movimento = this.form.getRawValue();

        return {
            contratoId: movimento.contratoId,
            dataInicialPeriodo: this.paraTexto(movimento.dataInicialPeriodo!),
            dataFinalPeriodo: this.paraTexto(movimento.dataFinalPeriodo!),
            mesAnoReferencia: movimento.mesAnoReferencia,
            dataLimitePagamentoConta: this.paraTexto(movimento.dataLimitePagamentoConta!),
            dataLimitePagamentoCedente: this.paraTexto(movimento.dataLimitePagamentoCedente!),
            dataLimitePagamentoContratada: this.paraTexto(movimento.dataLimitePagamentoContratada!),
            creditoUtilizado: movimento.creditoUtilizado,
            energiaConsumidaValorTusdAtiva: movimento.energiaConsumidaValorTusdAtiva,
            energiaConsumidaValorTeAtiva: movimento.energiaConsumidaValorTeAtiva,
            energiaConsumidaBandeira: movimento.energiaConsumidaBandeira,
            ipCipEncargos: movimento.ipCipEncargos,
            creditoUtilizadoValorTusdInjetada: movimento.creditoUtilizadoValorTusdInjetada,
            creditoUtilizadoValorTeInjetada: movimento.creditoUtilizadoValorTeInjetada,
            creditoUtilizadoBandeira: movimento.creditoUtilizadoBandeira,
            valorTotalSemDesconto: movimento.valorTotalSemDesconto,
            valorDesconto: movimento.valorDesconto,
            valorTotalComDesconto: movimento.valorTotalComDesconto,
            valorCpfl: movimento.valorCpfl,
            valorPagoParaCedente: movimento.valorPagoParaCedente,
            valorEmissaoNotaFiscal: movimento.valorEmissaoNotaFiscal,
            valorPagoParaContratada: movimento.valorPagoParaContratada,
            valorTotalPagoComCreditos: movimento.valorTotalPagoComCreditos,
            valorTotalPagoSemCreditos: movimento.valorTotalPagoSemCreditos,
            valorEconomia: movimento.valorEconomia,
            saldoRestante: movimento.saldoRestante
        };
    }

    private montarRequestAdicionar() {
        return this.dadosComuns();
    }

    private montarRequestAtualizar() {
        return {
            id: this.movimentoId!,
            ...this.dadosComuns()
        };
    }

    cancelar() {
        this.voltarParaListagem();
    }
}
