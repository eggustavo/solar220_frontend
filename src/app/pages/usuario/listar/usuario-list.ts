import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '@/app/services/usuario.service';
import { TipoUsuarioService } from '@/app/services/tipo-usuario.service';
import { AuthService } from '@/app/services/auth.service';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-usuario-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, TagModule, ButtonModule, ToolbarModule, TooltipModule, ConfirmDialogModule, MenuModule, SelectModule],
    templateUrl: './usuario-list.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [ConfirmationService, TipoUsuarioService]
})
export class UsuarioList implements OnInit {
    usuarios = signal<any[]>([]);
    tiposUsuario = signal<any[]>([]);

    loading = signal<boolean>(false);

    menuItems: MenuItem[] = [];

    constructor(
        private readonly usuarioService: UsuarioService,
        private readonly tipoUsuarioService: TipoUsuarioService,
        private readonly authService: AuthService,
        private readonly confirmationService: ConfirmationService,
        private readonly messageService: MessageService,
        private readonly router: Router
    ) {}

    ngOnInit() {
        this.tiposUsuario.set(this.tipoUsuarioService.listar());
        this.carregarUsuarios();
    }

    carregarUsuarios() {
        this.loading.set(true);

        this.usuarioService.listar().subscribe({
            next: (resposta) => {
                this.usuarios.set(resposta.items ?? []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    severidadeTipo(tipo: string): 'info' | 'warn' | 'secondary' {
        switch (tipo) {
            case 'Administrador':
                return 'warn';
            case 'Operador':
                return 'info';
            default:
                return 'secondary';
        }
    }

    ehUsuarioLogado(usuario: any): boolean {
        return usuario.id === this.authService.usuario()?.id;
    }

    adicionar() {
        this.router.navigate(['/pages/usuarios/novo']);
    }

    editar(usuario: any) {
        this.router.navigate(['/pages/usuarios/editar', usuario.id]);
    }

    abrirMenuAcoes(event: Event, usuario: any, menu: any) {
        const proprioUsuario = this.ehUsuarioLogado(usuario);

        this.menuItems = [
            { label: 'Editar', icon: 'pi pi-pencil', command: () => this.editar(usuario) },
            { label: 'Enviar nova senha', icon: 'pi pi-key', disabled: usuario.status !== 'Ativo', title: usuario.status !== 'Ativo' ? 'Disponível apenas para usuários ativos' : undefined, command: () => this.enviarNovaSenha(usuario) },
            { separator: true },
            { label: 'Excluir', icon: 'pi pi-trash', styleClass: 'text-red-500', disabled: proprioUsuario, title: proprioUsuario ? 'Você não pode excluir o seu próprio usuário' : undefined, command: () => this.excluir(usuario) }
        ];
        menu.toggle(event);
    }

    enviarNovaSenha(usuario: any) {
        this.confirmationService.confirm({
            header: 'Enviar nova senha',
            message: `Deseja gerar uma nova senha provisória para "${usuario.nome}"?<br/><br/>A senha será enviada para <b>${usuario.email}</b> e o usuário deverá cadastrar uma nova senha no próximo acesso.`,
            icon: 'pi pi-key',
            acceptButtonProps: { label: 'Enviar' },
            rejectButtonProps: { severity: 'secondary', outlined: true, label: 'Cancelar' },
            accept: () => {
                this.usuarioService.enviarNovaSenha(usuario.id).subscribe({
                    next: (resposta) => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: resposta.items?.mensagem ?? 'Nova senha enviada com sucesso.', life: 4000 });
                        this.carregarUsuarios();
                    },
                    error: () => {}
                });
            }
        });
    }

    excluir(usuario: any) {
        this.confirmationService.confirm({
            header: 'Confirmar exclusão',
            message: `Deseja realmente excluir o usuário "${usuario.nome}"?`,
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger', label: 'Excluir' },
            rejectButtonProps: { severity: 'secondary', outlined: true, label: 'Cancelar' },
            accept: () => {
                this.usuarioService.excluir(usuario.id).subscribe({
                    next: (resposta) => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: resposta.items?.mensagem ?? 'Usuário excluído com sucesso.', life: 3000 });
                        this.carregarUsuarios();
                    },
                    error: () => {}
                });
            }
        });
    }
}
