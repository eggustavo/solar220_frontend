import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { UnidadeFederativaService } from '@/app/services/unidade-federativa.service.';
import { TipoChavePixService } from '@/app/services/tipo-chave-pix.service';
import { TipoRecebimentoSaldoService } from '@/app/services/tipo-recebimento-saldo';
import { TipoNegociacaoService } from '@/app/services/tipo-negociacao.service';
import { TipoFechamentoEnergiaService } from '@/app/services/tipo-fechamento-energia.service';
import { ParticipanteService } from '@/app/services/participante.service';
import { CepService } from '@/app/services/cep.service';

@Component({
    selector: 'app-participante-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, DatePickerModule, ToggleSwitchModule, MessageModule],
    templateUrl: './participante-form.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [UnidadeFederativaService, TipoChavePixService, TipoNegociacaoService, TipoFechamentoEnergiaService, TipoRecebimentoSaldoService]
})
export class ParticipanteForm implements OnInit {
    editando = signal<boolean>(false);
    salvando = signal<boolean>(false);
    carregando = signal<boolean>(false);
    unidadesFederativas = signal<any[]>([]);
    tiposChavePix = signal<any[]>([]);
    tiposNegociacao = signal<any[]>([]);
    tiposFechamentoEnergia = signal<any[]>([]);
    tiposRecebimentoSaldo = signal<any[]>([]);

    private participanteId: string | null = null;

    private readonly fb = inject(FormBuilder);

    form = this.fb.nonNullable.group({
        documento: ['', Validators.required],
        nome: ['', Validators.required],
        apelido: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        cep: ['', Validators.required],
        logradouro: ['', Validators.required],
        numero: ['', Validators.required],
        complemento: [''],
        bairro: ['', Validators.required],
        municipio: ['', Validators.required],
        unidadeFederativa: ['', [Validators.required]],
        dataFechamento: this.fb.control<Date | null>(null, Validators.required),
        flagCedente: [false],
        flagBeneficiario: [false],
        dadosBancario: this.fb.nonNullable.group({
            participanteId: [''],
            tipoChavePix: [''],
            chavePix: ['']
        }),
        cedente: this.fb.nonNullable.group({
            participanteId: [''],
            tipoNegociacao: [''],
            valorNegociacao: [0],
            numeroUc: [''],
            tipoFechamentoEnergia: ['']
        }),
        beneficiario: this.fb.nonNullable.group({
            participanteId: [''],
            desconto: [0],
            numeroUc: [''],
            tipoRecebimentoSaldo: [''],
            mediaConsumo: [0]
        })
    });

    constructor(
        private readonly unidadeFederativaService: UnidadeFederativaService,
        private readonly tipoChavePixService: TipoChavePixService,
        private readonly tipoNegociacaoService: TipoNegociacaoService,
        private readonly tipoFechamentoEnergiaService: TipoFechamentoEnergiaService,
        private readonly tipoRecebimentoSaldoService: TipoRecebimentoSaldoService,
        private readonly participanteService: ParticipanteService,
        private readonly cepService: CepService,
        private readonly messageService: MessageService,
        private readonly router: Router,
        private readonly route: ActivatedRoute
    ) {
        this.form.controls.flagCedente.valueChanges.subscribe((ativo) => this.atualizarValidadoresCedente(ativo));
        this.form.controls.flagBeneficiario.valueChanges.subscribe((ativo) => this.atualizarValidadoresBeneficiario(ativo));
    }

    private atualizarValidadoresCedente(ativo: boolean) {
        const grupo = this.form.controls.cedente.controls;
        const validador = ativo ? Validators.required : null;

        grupo.tipoNegociacao.setValidators(validador);
        grupo.valorNegociacao.setValidators(validador);
        grupo.numeroUc.setValidators(validador);
        grupo.tipoFechamentoEnergia.setValidators(validador);

        grupo.tipoNegociacao.updateValueAndValidity();
        grupo.valorNegociacao.updateValueAndValidity();
        grupo.numeroUc.updateValueAndValidity();
        grupo.tipoFechamentoEnergia.updateValueAndValidity();

        if (!ativo) {
            this.form.controls.cedente.markAsUntouched();
        }
    }

    private atualizarValidadoresBeneficiario(ativo: boolean) {
        const grupo = this.form.controls.beneficiario.controls;
        const validador = ativo ? Validators.required : null;

        grupo.desconto.setValidators(validador);
        grupo.numeroUc.setValidators(validador);
        grupo.tipoRecebimentoSaldo.setValidators(validador);
        grupo.mediaConsumo.setValidators(validador);

        grupo.desconto.updateValueAndValidity();
        grupo.numeroUc.updateValueAndValidity();
        grupo.tipoRecebimentoSaldo.updateValueAndValidity();
        grupo.mediaConsumo.updateValueAndValidity();

        if (!ativo) {
            this.form.controls.beneficiario.markAsUntouched();
        }
    }

    private marcarCamposRelevantesComoTocados() {
        this.form.markAllAsTouched();

        if (!this.form.controls.flagCedente.value) {
            this.form.controls.cedente.markAsUntouched();
        }
        if (!this.form.controls.flagBeneficiario.value) {
            this.form.controls.beneficiario.markAsUntouched();
        }
    }

    ngOnInit() {
        this.editando.set(true);

        this.participanteId = this.route.snapshot.paramMap.get('id');

        this.unidadesFederativas.set(this.unidadeFederativaService.listar());
        this.tiposChavePix.set(this.tipoChavePixService.listar());
        this.tiposNegociacao.set(this.tipoNegociacaoService.listar());
        this.tiposFechamentoEnergia.set(this.tipoFechamentoEnergiaService.listar());
        this.tiposRecebimentoSaldo.set(this.tipoRecebimentoSaldoService.listar());

        if (this.participanteId) {
            this.carregarParticipante(this.participanteId);
        } else {
            this.editando.set(false);
        }
    }

    carregarParticipante(id: string) {
        this.carregando.set(true);

        this.participanteService.obter(id).subscribe({
            next: (resposta) => {
                if (resposta.items) {
                    this.preencherFormulario(resposta.items);
                }
                this.carregando.set(false);
            },
            error: () => this.carregando.set(false)
        });
    }

    preencherFormulario(participante: any) {
        this.form.patchValue({
            documento: participante.documento,
            nome: participante.nome,
            apelido: participante.apelido,
            email: participante.email,
            cep: participante.cep,
            logradouro: participante.logradouro,
            numero: participante.numero,
            complemento: participante.complemento ?? '',
            bairro: participante.bairro,
            municipio: participante.municipio,
            unidadeFederativa: participante.unidadeFederativa,
            dataFechamento: this.paraData(participante.dataFechamento),
            flagCedente: participante.flagCedente,
            flagBeneficiario: participante.flagBeneficiario,
            dadosBancario: {
                participanteId: participante.dadosBancario?.participanteId ?? null,
                tipoChavePix: participante.dadosBancario?.tipoChavePix ?? null,
                chavePix: participante.dadosBancario?.chavePix ?? ''
            },
            cedente: {
                participanteId: participante.cedente?.participanteId ?? null,
                tipoNegociacao: participante.cedente?.tipoNegociacao ?? null,
                valorNegociacao: participante.cedente?.valorNegociacao ?? null,
                numeroUc: participante.cedente?.numeroUc ?? '',
                tipoFechamentoEnergia: participante.cedente?.tipoFechamentoEnergia ?? null
            },
            beneficiario: {
                participanteId: participante.beneficiario?.participanteId ?? null,
                desconto: participante.beneficiario?.desconto ?? null,
                numeroUc: participante.beneficiario?.numeroUc ?? '',
                tipoRecebimentoSaldo: participante.beneficiario?.tipoRecebimentoSaldo ?? null,
                mediaConsumo: participante.beneficiario?.mediaConsumo ?? null
            }
        });
    }

    salvar() {
        if (this.form.invalid) {
            this.marcarCamposRelevantesComoTocados();
            return;
        }

        this.salvando.set(true);

        if (this.editando()) {
            this.participanteService.atualizar(this.montarRequestAtualizar()).subscribe({
                next: (resposta) => this.aoSalvarComSucesso(resposta.items?.mensagem),
                error: () => this.salvando.set(false)
            });
        } else {
            this.participanteService.adicionar(this.montarRequestAdicionar()).subscribe({
                next: (resposta) => this.aoSalvarComSucesso(resposta.items?.mensagem),
                error: () => this.salvando.set(false)
            });
        }
    }

    cancelar() {
        this.voltarParaListagem();
    }

    buscarEnderecoPorCep() {
        const cep = this.form.controls.cep.value;

        if (!cep) {
            return;
        }

        this.cepService.buscarCep(cep).subscribe({
            next: (endereco) => {
                this.form.patchValue({
                    logradouro: endereco.logradouro,
                    complemento: endereco.complemento,
                    bairro: endereco.bairro,
                    municipio: endereco.localidade,
                    unidadeFederativa: endereco.uf
                });
            },
            error: (erro: Error) => {
                this.messageService.add({ severity: 'warn', summary: 'CEP', detail: erro.message, life: 4000 });
            }
        });
    }

    formatarDocumento() {
        const digitos = (this.form.controls.documento.value ?? '').replace(/\D/g, '');

        if (digitos.length === 11) {
            this.form.controls.documento.setValue(digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
        } else if (digitos.length === 14) {
            this.form.controls.documento.setValue(digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'));
        }
    }

    private aoSalvarComSucesso(mensagem: string | undefined) {
        this.salvando.set(false);
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: mensagem ?? 'Participante salvo com sucesso.', life: 3000 });
        this.voltarParaListagem();
    }

    private voltarParaListagem() {
        this.router.navigate(['/pages/participantes']);
    }

    private dadosComuns() {
        const participante = this.form.getRawValue();

        return {
            documento: participante.documento,
            nome: participante.nome,
            apelido: participante.apelido,
            email: participante.email,
            cep: participante.cep,
            logradouro: participante.logradouro,
            numero: participante.numero,
            complemento: participante.complemento || null,
            bairro: participante.bairro,
            municipio: participante.municipio,
            unidadeFederativa: participante.unidadeFederativa!,
            dataFechamento: this.paraTexto(participante.dataFechamento!),
            flagCedente: participante.flagCedente,
            flagBeneficiario: participante.flagBeneficiario
        };
    }

    private montarBancario() {
        const { tipoChavePix, chavePix } = this.form.getRawValue().dadosBancario;

        if (!tipoChavePix || !chavePix) {
            return null;
        }

        return { tipoChavePix, chavePix };
    }

    private montarCedente() {
        const participante = this.form.getRawValue();

        if (!participante.flagCedente) {
            return null;
        }

        return {
            tipoNegociacao: participante.cedente.tipoNegociacao!,
            valorNegociacao: participante.cedente.valorNegociacao ?? 0,
            numeroUc: participante.cedente.numeroUc || null,
            tipoFechamentoEnergia: participante.cedente.tipoFechamentoEnergia!
        };
    }

    private montarBeneficiario() {
        const participante = this.form.getRawValue();

        if (!participante.flagBeneficiario) {
            return null;
        }

        return {
            desconto: participante.beneficiario.desconto ?? 0,
            numeroUc: participante.beneficiario.numeroUc || null,
            tipoRecebimentoSaldo: participante.beneficiario.tipoRecebimentoSaldo!,
            mediaConsumo: participante.beneficiario.mediaConsumo ?? 0
        };
    }

    private montarRequestAdicionar() {
        return {
            ...this.dadosComuns(),
            dadosBancario: this.montarBancario(),
            cedente: this.montarCedente(),
            beneficiario: this.montarBeneficiario()
        };
    }

    private montarRequestAtualizar() {
        return {
            id: this.participanteId!,
            ...this.dadosComuns(),
            dadosBancario: this.montarBancario(),
            cedente: this.montarCedente(),
            beneficiario: this.montarBeneficiario()
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
