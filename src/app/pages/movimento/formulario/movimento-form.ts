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
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, InputNumberModule, DatePickerModule, SelectModule, InputMaskModule, ButtonModule, TagModule],
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
        valorEmissaoNotaFiscal: this.fb.control<number | null>({ value: null, disabled: true }),
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

    calcular() {
        const contrato = this.contratoSelecionado();

        if (contrato === null) {
            return;
        }

        const formValue = this.form.getRawValue();

        const valorTotalSemDesconto = formValue.creditoUtilizadoValorTusdInjetada + formValue.creditoUtilizadoValorTeInjetada;
        const valorDesconto = (valorTotalSemDesconto * (contrato.beneficiarioDesconto ?? 0)) / 100;
        const valorTotalComDesconto = valorTotalSemDesconto - valorDesconto;
        const valorPagoParaCedente = valorTotalSemDesconto - valorDesconto + formValue.creditoUtilizadoBandeira;

        let valorPagoParaContratada = 0;
        if (contrato.cedenteTipoNegociacao === 'Fixo') {
            valorPagoParaContratada = valorPagoParaCedente - formValue.creditoUtilizado * (contrato.cedenteValorNegociacao ?? 0);
        } else {
            valorPagoParaContratada = valorPagoParaCedente - formValue.creditoUtilizado * 1;
        }

        const valorTotalPagoComCreditos = formValue.valorCpfl + valorPagoParaCedente;
        const valorTotalPagoSemCreditos = formValue.energiaConsumidaValorTusdAtiva + formValue.energiaConsumidaValorTeAtiva + formValue.ipCipEncargos + formValue.energiaConsumidaBandeira;
        const valorEconomia = valorTotalPagoSemCreditos - valorTotalPagoComCreditos;

        this.form.patchValue(
            {
                valorTotalSemDesconto,
                valorDesconto,
                valorTotalComDesconto,
                valorPagoParaCedente,
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
