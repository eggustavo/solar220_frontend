import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { AuthService } from '@/app/services/auth.service';
import { PerfilUsuario } from '@/app/models/usuario-logado.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    constructor(private readonly authService: AuthService) {}

    ngOnInit() {
        this.model = this.filtrarPorPerfil(this.montarMenu());
    }

    // Mantém somente os itens permitidos ao perfil do usuário (state.perfis) e remove grupos que ficarem vazios
    private filtrarPorPerfil(itens: MenuItem[]): MenuItem[] {
        return itens
            .filter((item) => !item.state?.['perfis'] || this.authService.possuiPerfil(item.state['perfis'] as PerfilUsuario[]))
            .map((item) => (item.items ? { ...item, items: this.filtrarPorPerfil(item.items) } : item))
            .filter((item) => !item.items || item.items.length > 0);
    }

    private montarMenu(): MenuItem[] {
        return [
            {
                label: 'Home',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'], state: { perfis: ['Administrador'] } }]
            },
            {
                label: 'Cadastros',
                icon: 'pi pi-fw pi-briefcase',
                path: '/pages',
                items: [
                    {
                        label: 'Participantes',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/pages/participantes'],
                        state: { perfis: ['Administrador'] }
                    },
                    {
                        label: 'Contratos',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/pages/contratos'],
                        state: { perfis: ['Administrador'] }
                    },
                    {
                        label: 'Usuários',
                        icon: 'pi pi-fw pi-id-card',
                        routerLink: ['/pages/usuarios'],
                        state: { perfis: ['Administrador'] }
                    }
                ]
            },
            {
                label: 'Lançamentos',
                icon: 'pi pi-fw pi-briefcase',
                path: '/pages',
                items: [
                    {
                        label: 'Lançamentos',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/pages/movimentos'],
                        state: { perfis: ['Operador'] }
                    },
                    {
                        label: 'Meus Lançamentos',
                        icon: 'pi pi-fw pi-list',
                        routerLink: ['/pages/meus-lancamentos'],
                        state: { perfis: ['Participante'] }
                    }
                ]
            }            
        ];
    }
}
