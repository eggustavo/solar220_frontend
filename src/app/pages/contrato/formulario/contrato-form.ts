import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ContratoService } from '@/app/services/contrato.service';
import { ParticipanteService } from '@/app/services/participante.service';
import { TipoContratoService } from '@/app/services/tipo-contrato.service';
import { StatusContratoService } from '@/app/services/status-contrato.service';
import { BandeiraTipoCobrancaService } from '@/app/services/bandeira-tipo-cobranca.service';
import { BaseCalculoService } from '@/app/services/base-calculo.service';
import { NotaFiscalTipoEmissaoService } from '@/app/services/nota-fiscal-tipo-emissao.service';
import { TipoNegociacaoService } from '@/app/services/tipo-negociacao.service';

@Component({
    selector: 'app-contrato-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, DatePickerModule, ToggleSwitchModule, TextareaModule],
    templateUrl: './contrato-form.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [TipoContratoService, StatusContratoService, BandeiraTipoCobrancaService, BaseCalculoService, NotaFiscalTipoEmissaoService, TipoNegociacaoService]
})
export class ContratoForm implements OnInit {
    editando = signal<boolean>(false);
    salvando = signal<boolean>(false);
    carregando = signal<boolean>(false);

    descricaoContrato = signal<string>('');

    cedentes = signal<any[]>([]);
    beneficiarios = signal<any[]>([]);
    tiposContrato = signal<any[]>([]);
    statusContrato = signal<any[]>([]);
    bandeirasTipoCobranca = signal<any[]>([]);
    basesCalculo = signal<any[]>([]);
    tiposNotaFiscalEmissao = signal<any[]>([]);
    tiposNegociacao = signal<any[]>([]);

    private contratoId: string | null = null;

    private readonly fb = inject(FormBuilder);

    form = this.fb.nonNullable.group({
        dataInicioOperacao: this.fb.control<Date | null>(null, Validators.required),
        bandeiraTipoCobranca: ['', Validators.required],
        flagValorContaEnergiaInclusoNoPagamentoAoCedente: [false],
        pagamentoPorBoletoEmitidoPela220: [false],
        observacao: [''],
        tipoContrato: ['', Validators.required],
        status: ['', Validators.required],
        cedenteId: ['', Validators.required],
        cedenteNumeroUc: [''],
        cedenteTipoNegociacao: ['', Validators.required],
        cedenteValorNegociacao: [0, Validators.required],
        cedenteBaseCalculo: ['', Validators.required],
        beneficiarioId: ['', Validators.required],
        beneficiarioNumeroUc: [''],
        beneficiarioPercentualDesconto: [0, Validators.required],
        beneficiarioMediaConsumo: [0, Validators.required],
        notaFiscalTipoEmissao: ['', Validators.required],
        notaFiscalPercentualEmissao: this.fb.control<number | null>(null),
        notaFiscalBaseCalculo: this.fb.control<string | null>(null, Validators.required)
    });

    constructor(
        private readonly contratoService: ContratoService,
        private readonly participanteService: ParticipanteService,
        private readonly tipoContratoService: TipoContratoService,
        private readonly statusContratoService: StatusContratoService,
        private readonly bandeiraTipoCobrancaService: BandeiraTipoCobrancaService,
        private readonly baseCalculoService: BaseCalculoService,
        private readonly notaFiscalTipoEmissaoService: NotaFiscalTipoEmissaoService,
        private readonly tipoNegociacaoService: TipoNegociacaoService,
        private readonly messageService: MessageService,
        private readonly router: Router,
        private readonly route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.contratoId = this.route.snapshot.paramMap.get('id');
        this.editando.set(!!this.contratoId);

        this.tiposContrato.set(this.tipoContratoService.listar());
        this.statusContrato.set(this.statusContratoService.listar());
        this.bandeirasTipoCobranca.set(this.bandeiraTipoCobrancaService.listar());
        this.basesCalculo.set(this.baseCalculoService.listar());
        this.tiposNotaFiscalEmissao.set(this.notaFiscalTipoEmissaoService.listar());
        this.tiposNegociacao.set(this.tipoNegociacaoService.listar());

        this.carregarParticipantes();

        this.form.controls.notaFiscalTipoEmissao.valueChanges.subscribe((tipoEmissao) => this.aplicarRegraNotaFiscalTipoEmissao(tipoEmissao));

        if (this.contratoId) {
            this.carregarContrato(this.contratoId);
        }
    }

    private aplicarRegraNotaFiscalTipoEmissao(tipoEmissao: string) {
        if (tipoEmissao === 'NaoSeAplica') {
            this.form.controls.notaFiscalPercentualEmissao.setValue(null);
            this.form.controls.notaFiscalBaseCalculo.setValue(null);
            this.form.controls.notaFiscalPercentualEmissao.disable();
            this.form.controls.notaFiscalBaseCalculo.disable();
        } else {
            this.form.controls.notaFiscalPercentualEmissao.enable();
            this.form.controls.notaFiscalBaseCalculo.enable();
        }
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

    private carregarContrato(id: string) {
        this.carregando.set(true);

        this.contratoService.obter(id).subscribe({
            next: (resposta) => {
                if (resposta.items) {
                    this.preencherFormulario(resposta.items);
                }
                this.carregando.set(false);
            },
            error: () => this.carregando.set(false)
        });
    }

    preencherFormulario(contrato: any) {
        this.descricaoContrato.set(contrato.descricao ?? '');

        this.form.patchValue({
            dataInicioOperacao: this.paraData(contrato.dataInicioOperacao),
            bandeiraTipoCobranca: contrato.bandeiraTipoCobranca,
            flagValorContaEnergiaInclusoNoPagamentoAoCedente: contrato.flagValorContaEnergiaInclusoNoPagamentoAoCedente,
            pagamentoPorBoletoEmitidoPela220: contrato.pagamentoPorBoletoEmitidoPela220,
            observacao: contrato.observacao ?? '',
            tipoContrato: contrato.tipoContrato,
            status: contrato.status,
            cedenteId: contrato.cedenteId,
            cedenteNumeroUc: contrato.cedenteNumeroUc ?? '',
            cedenteTipoNegociacao: contrato.cedenteTipoNegociacao,
            cedenteValorNegociacao: contrato.cedenteValorNegociacao,
            cedenteBaseCalculo: contrato.cedenteBaseCalculo,
            beneficiarioId: contrato.beneficiarioId,
            beneficiarioNumeroUc: contrato.beneficiarioNumeroUc ?? '',
            beneficiarioPercentualDesconto: contrato.beneficiarioPercentualDesconto,
            beneficiarioMediaConsumo: contrato.beneficiarioMediaConsumo,
            notaFiscalTipoEmissao: contrato.notaFiscalTipoEmissao,
            notaFiscalPercentualEmissao: contrato.notaFiscalPercentualEmissao,
            notaFiscalBaseCalculo: contrato.notaFiscalBaseCalculo
        });
    }

    salvar() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.salvando.set(true);

        if (this.editando()) {
            this.contratoService.atualizar(this.montarRequestAtualizar()).subscribe({
                next: (resposta) => this.aoSalvarComSucesso(resposta.items?.mensagem),
                error: () => this.salvando.set(false)
            });
        } else {
            this.contratoService.adicionar(this.montarRequestAdicionar()).subscribe({
                next: (resposta) => this.aoSalvarComSucesso(resposta.items?.mensagem),
                error: () => this.salvando.set(false)
            });
        }
    }

    cancelar() {
        this.voltarParaListagem();
    }

    private aoSalvarComSucesso(mensagem: string | undefined) {
        this.salvando.set(false);
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: mensagem ?? 'Contrato salvo com sucesso.', life: 3000 });
        this.voltarParaListagem();
    }

    private voltarParaListagem() {
        this.router.navigate(['/pages/contratos']);
    }

    private dadosComuns() {
        const contrato = this.form.getRawValue();

        return {
            dataInicioOperacao: this.paraTexto(contrato.dataInicioOperacao!),
            bandeiraTipoCobranca: contrato.bandeiraTipoCobranca,
            flagValorContaEnergiaInclusoNoPagamentoAoCedente: contrato.flagValorContaEnergiaInclusoNoPagamentoAoCedente,
            pagamentoPorBoletoEmitidoPela220: contrato.pagamentoPorBoletoEmitidoPela220,
            observacao: contrato.observacao || null,
            tipoContrato: contrato.tipoContrato,
            status: contrato.status,
            cedenteId: contrato.cedenteId,
            cedenteNumeroUc: contrato.cedenteNumeroUc || null,
            cedenteTipoNegociacao: contrato.cedenteTipoNegociacao,
            cedenteValorNegociacao: contrato.cedenteValorNegociacao,
            cedenteBaseCalculo: contrato.cedenteBaseCalculo,
            beneficiarioId: contrato.beneficiarioId,
            beneficiarioNumeroUc: contrato.beneficiarioNumeroUc || null,
            beneficiarioPercentualDesconto: contrato.beneficiarioPercentualDesconto,
            beneficiarioMediaConsumo: contrato.beneficiarioMediaConsumo,
            notaFiscalTipoEmissao: contrato.notaFiscalTipoEmissao,
            notaFiscalPercentualEmissao: contrato.notaFiscalPercentualEmissao,
            notaFiscalBaseCalculo: contrato.notaFiscalBaseCalculo
        };
    }

    private montarRequestAdicionar() {
        return this.dadosComuns();
    }

    private montarRequestAtualizar() {
        return {
            id: this.contratoId!,
            ...this.dadosComuns()
        };
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
}
