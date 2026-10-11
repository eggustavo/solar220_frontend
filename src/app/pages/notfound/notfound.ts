import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-notfound',
    standalone: true,
    imports: [RouterModule, AppFloatingConfigurator, ButtonModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: ` <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen overflow-hidden px-4">
            <div class="flex flex-col items-center text-center max-w-xl">
                <span class="text-primary font-bold text-6xl mb-4">404</span>
                <h1 class="text-surface-900 dark:text-surface-0 font-bold text-3xl mb-4">Página não encontrada</h1>
                <p class="text-muted-color text-lg mb-8">O endereço acessado não existe ou foi removido. Verifique se o link está correto ou volte para o Dashboard para continuar navegando.</p>
                <p-button label="Voltar para o Dashboard" icon="pi pi-home" routerLink="/" />
            </div>
        </div>`
})
export class Notfound {}
