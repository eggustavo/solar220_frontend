import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { UsuarioService } from '@/app/services/usuario.service';
import { TipoUsuarioService } from '@/app/services/tipo-usuario.service';
import { StatusUsuarioService } from '@/app/services/status-usuario.service';
import { AuthService } from '@/app/services/auth.service';

@Component({
    selector: 'app-usuario-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, MessageModule],
    templateUrl: './usuario-form.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [TipoUsuarioService, StatusUsuarioService]
})
export class UsuarioForm implements OnInit {
    editando = signal<boolean>(false);
    salvando = signal<boolean>(false);
    carregando = signal<boolean>(false);
    proprioUsuario = signal<boolean>(false);
    tiposUsuario = signal<any[]>([]);
    statusUsuario = signal<any[]>([]);

    private usuarioId: string | null = null;

    private readonly fb = inject(FormBuilder);

    form = this.fb.nonNullable.group({
        nome: ['', [Validators.required, Validators.maxLength(200)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
        login: ['', [Validators.required, Validators.maxLength(20)]],
        tipo: ['', Validators.required],
        status: ['Ativo', Validators.required]
    });

    constructor(
        private readonly usuarioService: UsuarioService,
        private readonly tipoUsuarioService: TipoUsuarioService,
        private readonly statusUsuarioService: StatusUsuarioService,
        private readonly authService: AuthService,
        private readonly messageService: MessageService,
        private readonly router: Router,
        private readonly route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.tiposUsuario.set(this.tipoUsuarioService.listar());
        this.statusUsuario.set(this.statusUsuarioService.listar());

        this.usuarioId = this.route.snapshot.paramMap.get('id');
        this.editando.set(!!this.usuarioId);

        if (this.usuarioId) {
            this.carregarUsuario(this.usuarioId);
        }
    }

    private carregarUsuario(id: string) {
        this.carregando.set(true);

        this.usuarioService.obter(id).subscribe({
            next: (resposta) => {
                const usuario = resposta.items;

                if (usuario) {
                    this.form.patchValue({
                        nome: usuario.nome,
                        email: usuario.email,
                        login: usuario.login,
                        tipo: usuario.tipo,
                        status: usuario.status
                    });

                    // O próprio administrador não pode alterar o seu perfil nem se inativar (evita perder o acesso)
                    if (usuario.id === this.authService.usuario()?.id) {
                        this.proprioUsuario.set(true);
                        this.form.controls.tipo.disable();
                        this.form.controls.status.disable();
                    }
                }

                this.carregando.set(false);
            },
            error: () => this.carregando.set(false)
        });
    }

    salvar() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const usuario = this.form.getRawValue();
        const dados = { nome: usuario.nome.trim(), email: usuario.email.trim(), login: usuario.login.trim(), tipo: usuario.tipo };

        this.salvando.set(true);

        const requisicao = this.editando() ? this.usuarioService.atualizar({ id: this.usuarioId!, ...dados, status: usuario.status }) : this.usuarioService.adicionar(dados);

        requisicao.subscribe({
            next: (resposta) => {
                this.salvando.set(false);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: resposta.items?.mensagem ?? 'Usuário salvo com sucesso.', life: 4000 });
                this.voltarParaListagem();
            },
            error: () => this.salvando.set(false)
        });
    }

    cancelar() {
        this.voltarParaListagem();
    }

    private voltarParaListagem() {
        this.router.navigate(['/pages/usuarios']);
    }
}
