import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { UnidadeFederativaService } from '@/app/services/unidade-federativa.service.';
import { TipoChavePixService } from '@/app/services/tipo-chave-pix.service';
import { ParticipanteService } from '@/app/services/participante.service';
import { CepService } from '@/app/services/cep.service';
import { ParticipanteUsuarioService } from '@/app/services/participante-usuario.service';

@Component({
    selector: 'app-participante-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, ButtonModule, InputTextModule, SelectModule, DatePickerModule, ToggleSwitchModule, MessageModule, TableModule, TagModule, TooltipModule, DialogModule, ConfirmDialogModule],
    templateUrl: './participante-form.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [UnidadeFederativaService, TipoChavePixService, ConfirmationService]
})
export class ParticipanteForm implements OnInit {
    editando = signal<boolean>(false);
    salvando = signal<boolean>(false);
    carregando = signal<boolean>(false);
    unidadesFederativas = signal<any[]>([]);
    tiposChavePix = signal<any[]>([]);

    // Usuários de acesso vinculados ao participante (ParticipanteUsuario)
    usuarios = signal<any[]>([]);
    usuariosCarregando = signal<boolean>(false);
    usuariosDisponiveis = signal<any[]>([]);
    novoUsuarioVisivel = signal<boolean>(false);
    vincularUsuarioVisivel = signal<boolean>(false);
    salvandoUsuario = signal<boolean>(false);
    usuarioSelecionadoId: string | null = null;
    novoUsuario = { nome: '', email: '', login: '' };

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
            banco: [''],
            tipoChavePix: [''],
            chavePix: ['']
        })
    });

    constructor(
        private readonly unidadeFederativaService: UnidadeFederativaService,
        private readonly tipoChavePixService: TipoChavePixService,
        private readonly participanteService: ParticipanteService,
        private readonly cepService: CepService,
        private readonly messageService: MessageService,
        private readonly participanteUsuarioService: ParticipanteUsuarioService,
        private readonly confirmationService: ConfirmationService,
        private readonly router: Router,
        private readonly route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.editando.set(true);

        this.participanteId = this.route.snapshot.paramMap.get('id');

        this.unidadesFederativas.set(this.unidadeFederativaService.listar());
        this.tiposChavePix.set(this.tipoChavePixService.listar());

        if (this.participanteId) {
            this.carregarParticipante(this.participanteId);
            this.carregarUsuarios();
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
                banco: participante.dadosBancario?.banco ?? '',
                tipoChavePix: participante.dadosBancario?.tipoChavePix ?? null,
                chavePix: participante.dadosBancario?.chavePix ?? ''
            }
        });
    }

    salvar() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
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

    // ---------- Usuários de acesso ----------

    carregarUsuarios() {
        if (!this.participanteId) {
            return;
        }

        this.usuariosCarregando.set(true);

        this.participanteUsuarioService.listar(this.participanteId).subscribe({
            next: (resposta) => {
                this.usuarios.set(resposta.items ?? []);
                this.usuariosCarregando.set(false);
            },
            error: () => this.usuariosCarregando.set(false)
        });
    }

    abrirNovoUsuario() {
        this.novoUsuario = { nome: '', email: '', login: '' };
        this.novoUsuarioVisivel.set(true);
    }

    novoUsuarioValido(): boolean {
        const { nome, email, login } = this.novoUsuario;
        return !!nome.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && !!login.trim() && login.trim().length <= 20;
    }

    salvarNovoUsuario() {
        if (!this.participanteId || !this.novoUsuarioValido()) {
            return;
        }

        this.salvandoUsuario.set(true);

        this.participanteUsuarioService
            .adicionar({ participanteId: this.participanteId, nome: this.novoUsuario.nome.trim(), email: this.novoUsuario.email.trim(), login: this.novoUsuario.login.trim() })
            .subscribe({
                next: (resposta) => {
                    this.salvandoUsuario.set(false);
                    this.novoUsuarioVisivel.set(false);
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: resposta.items?.mensagem ?? 'Usuário cadastrado com sucesso.', life: 4000 });
                    this.carregarUsuarios();
                },
                error: () => this.salvandoUsuario.set(false)
            });
    }

    abrirVincularUsuario() {
        if (!this.participanteId) {
            return;
        }

        this.usuarioSelecionadoId = null;
        this.usuariosDisponiveis.set([]);
        this.vincularUsuarioVisivel.set(true);

        this.participanteUsuarioService.listarDisponiveis(this.participanteId).subscribe({
            next: (resposta) => this.usuariosDisponiveis.set(resposta.items ?? [])
        });
    }

    salvarVinculo() {
        if (!this.participanteId || !this.usuarioSelecionadoId) {
            return;
        }

        this.salvandoUsuario.set(true);

        this.participanteUsuarioService.vincular({ participanteId: this.participanteId, usuarioId: this.usuarioSelecionadoId }).subscribe({
            next: (resposta) => {
                this.salvandoUsuario.set(false);
                this.vincularUsuarioVisivel.set(false);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: resposta.items?.mensagem ?? 'Usuário vinculado com sucesso.', life: 3000 });
                this.carregarUsuarios();
            },
            error: () => this.salvandoUsuario.set(false)
        });
    }

    desvincularUsuario(vinculo: any) {
        this.confirmationService.confirm({
            header: 'Remover usuário',
            message: `Deseja remover o acesso de "${vinculo.nome}" a este participante?<br/><br/>O usuário continuará cadastrado, mas deixará de ver os lançamentos deste participante.`,
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger', label: 'Remover' },
            rejectButtonProps: { severity: 'secondary', outlined: true, label: 'Cancelar' },
            accept: () => {
                this.participanteUsuarioService.excluir(vinculo.id).subscribe({
                    next: (resposta) => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: resposta.items?.mensagem ?? 'Usuário desvinculado com sucesso.', life: 3000 });
                        this.carregarUsuarios();
                    },
                    error: () => {}
                });
            }
        });
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
            flagBeneficiario: participante.flagBeneficiario,
            dadosBancario: this.montarBancario()
        };
    }

    private montarBancario() {
        const { banco, tipoChavePix, chavePix } = this.form.getRawValue().dadosBancario;

        if (!banco && (!tipoChavePix || !chavePix)) {
            return null;
        }

        return {
            banco: banco || null,
            tipoChavePix: tipoChavePix || null,
            chavePix: chavePix || null
        };
    }

    private montarRequestAdicionar() {
        return this.dadosComuns();
    }

    private montarRequestAtualizar() {
        return {
            id: this.participanteId!,
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
