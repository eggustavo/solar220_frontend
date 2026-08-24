import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ParticipanteService } from '@/app/services/participante.service';
import { debounceTime, merge } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TipoNegociacaoService } from '@/app/services/tipo-negociacao.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MovimentoService } from '@/app/services/movimento.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-movimento-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, InputNumberModule, DatePickerModule, SelectModule, InputMaskModule, ButtonModule],
    styleUrl: './movimento-form.scss',
    templateUrl: './movimento-form.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [TipoNegociacaoService]
})
export class MovimentoForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly participanteService = inject(ParticipanteService);
    private readonly movimentoService = inject(MovimentoService);
    private readonly tipoNegociacaoService = inject(TipoNegociacaoService);

    editando = signal<boolean>(false);
    salvando = signal<boolean>(false);
    carregando = signal<boolean>(false);
    cedentes = signal<any[]>([]);
    beneficiarios = signal<any[]>([]);

    cedenteSelecionado = signal<any>(null);
    beneficiarioSelecionado = signal<any>(null);
    tiposNegociacao = signal<any[]>([]);

    form = this.fb.nonNullable.group({
        participanteCedenteId: ['', Validators.required],
        participanteBeneficiarioId: ['', Validators.required],
        analistaResponsavel: [''],
        numeroUc: [{ value: '', disabled: true }],
        dataInicialPeriodo: this.fb.control<Date | null>(null, Validators.required),
        dataFinalPeriodo: this.fb.control<Date | null>(null, Validators.required),
        mesAnoReferencia: ['', Validators.required],
        dataLimitePagamentoConta: this.fb.control<Date | null>(null),
        dataLimitePagamentoCedente: this.fb.control<Date | null>(null),
        dataLimitePagamentoContratada: this.fb.control<Date | null>(null),
        creditoUtilizado: [0],
        energiaConsumidaValorTusdAtiva: [0],
        energiaConsumidaValorTeAtiva: [0],
        energiaConsumidaBandeira: [0],
        ipCipEncargos: [0],
        creditoUtilizadoValorTusdInjetada: [0],
        creditoUtilizadoValorTeInjetada: [0],
        creditoUtilizadoBandeira: [0],
        valorTotalSemDesconto: [{ value: 0, disabled: true }],
        percentualDesconto: [{ value: 0, disabled: true }],
        desconto: [{ value: 0, disabled: true }],
        valorTotalComDesconto: [{ value: 0, disabled: true }],
        valorCpfl: [0],
        valorPagoParaCedente: [{ value: 0, disabled: true }],
        tipoNegociacao: [{ value: '', disabled: true }],
        valorNegociacao: [{ value: 0, disabled: true }],
        valorPagoParaContratada: [{ value: 0, disabled: true }],
        valorTotalPagoComCreditos: [{ value: 0, disabled: true }],
        valorTotalPagoSemCreditos: [{ value: 0, disabled: true }],
        economia: [{ value: 0, disabled: true }],
        saldoRestante: [0]
    });

    private movimentoId: string | null = null;

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly messageService: MessageService,
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
        this.carregarParticipantes();

        merge(...this.camposDadosParaCalculos.map((campo) => this.form.controls[campo].valueChanges))
            .pipe(debounceTime(500))
            .subscribe(() => this.calcular());

        this.form.controls.participanteCedenteId.valueChanges.subscribe((id) => this.obterCedenteSelecionado(id));
        this.form.controls.participanteBeneficiarioId.valueChanges.subscribe((id) => this.obterBeneficiarioSelecionado(id));

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
            participanteCedenteId: movimento.participanteCedenteId,
            participanteBeneficiarioId: movimento.participanteBeneficiarioId,
            mesAnoReferencia: movimento.mesAnoReferencia ?? '',
            dataInicialPeriodo: this.paraData(movimento.dataInicialPeriodo),
            dataFinalPeriodo: this.paraData(movimento.dataFinalPeriodo),
            dataLimitePagamentoConta: movimento.dataLimitePagamentoConta ? this.paraData(movimento.dataLimitePagamentoConta) : null,
            dataLimitePagamentoCedente: movimento.dataLimitePagamentoCedente ? this.paraData(movimento.dataLimitePagamentoCedente) : null,
            dataLimitePagamentoContratada: movimento.dataLimitePagamentoContratada ? this.paraData(movimento.dataLimitePagamentoContratada) : null,
            creditoUtilizado: movimento.creditoUtilizado,
            energiaConsumidaValorTusdAtiva: movimento.energiaConsumidaValorTusdAtiva,
            energiaConsumidaValorTeAtiva: movimento.energiaConsumidaValorTeAtiva,
            energiaConsumidaBandeira: movimento.energiaConsumidaBandeira,
            ipCipEncargos: movimento.ipCipEncargos,
            creditoUtilizadoValorTusdInjetada: movimento.creditoUtilizadoValorTusdInjetada,
            creditoUtilizadoValorTeInjetada: movimento.creditoUtilizadoValorTeInjetada,
            creditoUtilizadoBandeira: movimento.creditoUtilizadoBandeira,
            valorTotalSemDesconto: movimento.valorTotalSemDesconto,
            percentualDesconto: movimento.percentualDesconto,
            desconto: movimento.desconto,
            valorTotalComDesconto: movimento.valorTotalComDesconto,
            valorCpfl: movimento.valorCpfl,
            valorPagoParaCedente: movimento.valorPagoParaCedente,
            tipoNegociacao: movimento.tipoNegociacao,
            valorNegociacao: movimento.valorNegociacao,
            valorPagoParaContratada: movimento.valorPagoParaContratada,
            valorTotalPagoComCreditos: movimento.valorTotalPagoComCreditos,
            valorTotalPagoSemCreditos: movimento.valorTotalPagoSemCreditos,
            economia: movimento.economia,
            saldoRestante: movimento.saldoRestante
        });
    }

    private carregarParticipantes() {
        this.participanteService.listar().subscribe({
            next: (resposta) => {
                const items = resposta.items ?? [];
                this.cedentes.set(items.filter((participante: any) => participante.flagCedente));
                this.beneficiarios.set(items.filter((participante: any) => participante.flagBeneficiario));
            }
        });
    }

    private obterCedenteSelecionado(id: string) {
        if (!id) {
            this.cedenteSelecionado.set(null);
            return;
        }

        this.participanteService.obter(id).subscribe({
            next: (resposta) => {
                this.cedenteSelecionado.set(resposta.items ?? null);
                this.form.patchValue(
                    {
                        tipoNegociacao: this.cedenteSelecionado().cedente?.tipoNegociacao || '',
                        valorNegociacao: this.cedenteSelecionado().cedente?.valorNegociacao || 0
                    },
                    { emitEvent: false }
                );
            }
        });
    }

    private obterBeneficiarioSelecionado(id: string) {
        if (!id) {
            this.beneficiarioSelecionado.set(null);
            return;
        }

        this.participanteService.obter(id).subscribe({
            next: (resposta) => {
                this.beneficiarioSelecionado.set(resposta.items ?? null);
                this.form.patchValue(
                    {
                        numeroUc: this.beneficiarioSelecionado().beneficiario?.numeroUc || '',
                        percentualDesconto: this.beneficiarioSelecionado().beneficiario?.desconto || 0
                    },
                    { emitEvent: false }
                );
            }
        });
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
        if (this.cedenteSelecionado() === null || this.beneficiarioSelecionado() === null) {
            return;
        }

        //Obtendo Valores do Formulário
        const formValue = this.form.getRawValue();

        //Calculando Valores
        const valorTotalSemDesconto = formValue.creditoUtilizadoValorTusdInjetada + formValue.creditoUtilizadoValorTeInjetada;
        const desconto = (valorTotalSemDesconto * formValue.percentualDesconto) / 100;
        const valorTotalComDesconto = valorTotalSemDesconto - desconto;
        const valorPagoParaCedente = (valorTotalSemDesconto - desconto) + formValue.creditoUtilizadoBandeira;

        let valorPagoParaContratada = 0;
        if (formValue.tipoNegociacao === 'Fixo') {
            valorPagoParaContratada = valorPagoParaCedente - (formValue.creditoUtilizado * formValue.valorNegociacao);
        } else {
            valorPagoParaContratada = valorPagoParaCedente - (formValue.creditoUtilizado * 1);
        }

        const valorTotalPagoComCreditos = formValue.valorCpfl + valorPagoParaCedente;
        const valorTotalPagoSemCreditos = formValue.energiaConsumidaValorTusdAtiva + formValue.energiaConsumidaValorTeAtiva + formValue.ipCipEncargos + formValue.energiaConsumidaBandeira;
        const economia = valorTotalPagoSemCreditos - valorTotalPagoComCreditos;

        this.form.patchValue(
            {
                valorTotalSemDesconto,
                desconto, 
                valorTotalComDesconto,
                valorPagoParaCedente,
                valorPagoParaContratada,
                valorTotalPagoComCreditos,
                valorTotalPagoSemCreditos,
                economia
            },
            { emitEvent: false }
        );
    }

    salvar() {
        if (this.form.invalid) {
            alert('Por favor, preencha todos os campos obrigatórios antes de salvar o movimento.');
            return;
        }

        alert('Deseja realmente salvar o movimento?');

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
            dataInicialPeriodo: this.paraTexto(movimento.dataInicialPeriodo!),
            dataFinalPeriodo: this.paraTexto(movimento.dataFinalPeriodo!),
            mesAnoReferencia: movimento.mesAnoReferencia || null,
            creditoUtilizado: movimento.creditoUtilizado,
            energiaConsumidaValorTusdAtiva: movimento.energiaConsumidaValorTusdAtiva,
            energiaConsumidaValorTeAtiva: movimento.energiaConsumidaValorTeAtiva,
            energiaConsumidaBandeira: movimento.energiaConsumidaBandeira,
            ipCipEncargos: movimento.ipCipEncargos,
            creditoUtilizadoValorTusdInjetada: movimento.creditoUtilizadoValorTusdInjetada,
            creditoUtilizadoValorTeInjetada: movimento.creditoUtilizadoValorTeInjetada,
            creditoUtilizadoBandeira: movimento.creditoUtilizadoBandeira,
            valorTotalSemDesconto: movimento.valorTotalSemDesconto,
            percentualDesconto: movimento.percentualDesconto,
            desconto: movimento.desconto,
            valorTotalComDesconto: movimento.valorTotalComDesconto,
            valorCpfl: movimento.valorCpfl,
            valorPagoParaCedente: movimento.valorPagoParaCedente,
            tipoNegociacao: movimento.tipoNegociacao,
            valorNegociacao: movimento.valorNegociacao,
            valorPagoParaContratada: movimento.valorPagoParaContratada,
            valorTotalPagoComCreditos: movimento.valorTotalPagoComCreditos,
            valorTotalPagoSemCreditos: movimento.valorTotalPagoSemCreditos,
            economia: movimento.economia,
            saldoRestante: movimento.saldoRestante,
            dataLimitePagamentoConta: movimento.dataLimitePagamentoConta ? this.paraTexto(movimento.dataLimitePagamentoConta) : '',
            dataLimitePagamentoCedente: movimento.dataLimitePagamentoCedente ? this.paraTexto(movimento.dataLimitePagamentoCedente) : '',
            dataLimitePagamentoContratada: movimento.dataLimitePagamentoContratada ? this.paraTexto(movimento.dataLimitePagamentoContratada) : ''
        };
    }

    private montarRequestAdicionar() {
        const movimento = this.form.getRawValue();

        return {
            participanteCedenteId: movimento.participanteCedenteId,
            participanteBeneficiarioId: movimento.participanteBeneficiarioId,
            ...this.dadosComuns()
        };
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
