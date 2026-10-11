import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { MenuModule } from 'primeng/menu';
import { AuthService } from '@/app/services/auth.service';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, MenuModule, AppConfigurator],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
                <svg viewBox="-45 -10 104 114" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M52.98 0.38 L28.59 0.51 L3.43 51.97
                        L14.48 52.09 L14.61 52.35 L0.64 93.52
                        L49.04 35.7 L49.04 34.69
                        L37.74 34.69 L37.61 34.31 Z"
                        fill="#CCD616"
                    />
                </svg>
                <span>Solar 220v</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <!-- Usuário logado: sempre visível (o texto dos botões padrão do topbar fica oculto no desktop) -->
            <button
                type="button"
                class="flex items-center gap-3 border-0 bg-transparent cursor-pointer rounded-full pl-1 pr-3 py-1 text-color hover:bg-emphasis transition-colors"
                (click)="menuUsuario.toggle($event)"
                [attr.aria-label]="'Menu do usuário ' + (authService.usuario()?.nome ?? '')"
            >
                <span class="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-contrast font-semibold text-sm shrink-0">{{ iniciais() }}</span>
                <span class="hidden sm:flex flex-col items-start leading-tight text-left">
                    <span class="font-semibold max-w-48 truncate">{{ authService.usuario()?.nome }}</span>
                    <span class="text-xs text-muted-color">{{ authService.usuario()?.tipo }}</span>
                </span>
                <i class="pi pi-angle-down text-muted-color text-sm"></i>
            </button>
            <p-menu #menuUsuario [popup]="true" [model]="itensUsuario" appendTo="body" />
        </div>
    </div>`
})
export class AppTopbar {
    items!: MenuItem[];

    layoutService = inject(LayoutService);

    authService = inject(AuthService);

    itensUsuario: MenuItem[] = [
        { label: 'Trocar senha', icon: 'pi pi-key', routerLink: ['/trocar-senha'] },
        { label: 'Sair', icon: 'pi pi-sign-out', command: () => this.authService.logout() }
    ];

    // Iniciais do nome (ex.: "Maria da Silva" -> "MS")
    iniciais(): string {
        const partes = (this.authService.usuario()?.nome ?? '').trim().split(/\s+/).filter(Boolean);

        if (partes.length === 0) {
            return '?';
        }

        const primeira = partes[0][0];
        const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
        return (primeira + ultima).toUpperCase();
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }
}
