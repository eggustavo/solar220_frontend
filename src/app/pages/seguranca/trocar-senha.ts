import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '@/app/services/auth.service';

@Component({
    selector: 'app-trocar-senha',
    standalone: true,
    imports: [ButtonModule, MessageModule, PasswordModule, FormsModule, AppFloatingConfigurator],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <svg viewBox="-45 -10 104 114" fill="none" xmlns="http://www.w3.org/2000/svg" class="mb-6 w-16 shrink-0 mx-auto">
                                <path d="M52.98 0.38 L28.59 0.51 L3.43 51.97 L14.48 52.09 L14.61 52.35 L0.64 93.52 L49.04 35.7 L49.04 34.69 L37.74 34.69 L37.61 34.31 Z" fill="#CCD616" />
                            </svg>
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Trocar senha</div>
                            <span class="text-muted-color font-medium">{{ authService.usuario()?.nome }}</span>
                        </div>

                        @if (trocaObrigatoria()) {
                            <p-message severity="info" styleClass="mb-8 md:w-120">Você está utilizando uma senha provisória. Cadastre uma nova senha para continuar.</p-message>
                        }

                        <form class="md:w-120" (ngSubmit)="salvar()">
                            <label for="senhaAtual" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">{{ trocaObrigatoria() ? 'Senha provisória' : 'Senha atual' }}</label>
                            <p-password inputId="senhaAtual" name="senhaAtual" [(ngModel)]="senhaAtual" autocomplete="current-password" [toggleMask]="true" [feedback]="false" [fluid]="true" styleClass="mb-6" [disabled]="salvando()" />

                            <label for="novaSenha" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Nova senha</label>
                            <p-password inputId="novaSenha" name="novaSenha" [(ngModel)]="novaSenha" autocomplete="new-password" [toggleMask]="true" [fluid]="true" [disabled]="salvando()" />
                            <small class="block text-muted-color mt-2 mb-6">Entre 6 e 20 caracteres, diferente da senha atual.</small>

                            <label for="confirmacaoNovaSenha" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Confirmar nova senha</label>
                            <p-password inputId="confirmacaoNovaSenha" name="confirmacaoNovaSenha" [(ngModel)]="confirmacaoNovaSenha" autocomplete="new-password" [toggleMask]="true" [feedback]="false" [fluid]="true" [disabled]="salvando()" />
                            <small class="block mt-2 mb-8" [class.text-red-500]="confirmacaoNovaSenha && confirmacaoNovaSenha !== novaSenha" [class.invisible]="!confirmacaoNovaSenha || confirmacaoNovaSenha === novaSenha">As senhas não coincidem.</small>

                            <p-button type="submit" label="Salvar" icon="pi pi-check" styleClass="w-full mb-6" [loading]="salvando()" [disabled]="!podeSalvar()" />

                            <div class="text-center">
                                @if (trocaObrigatoria()) {
                                    <a class="font-medium no-underline cursor-pointer text-primary" (click)="sair()"><i class="pi pi-sign-out text-sm mr-1"></i>Sair</a>
                                } @else {
                                    <a class="font-medium no-underline cursor-pointer text-primary" (click)="cancelar()"><i class="pi pi-arrow-left text-sm mr-1"></i>Voltar</a>
                                }
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class TrocarSenha {
    senhaAtual = '';
    novaSenha = '';
    confirmacaoNovaSenha = '';

    salvando = signal<boolean>(false);

    trocaObrigatoria = computed(() => !!this.authService.usuario()?.flagTrocarSenha);

    constructor(
        readonly authService: AuthService,
        private readonly messageService: MessageService,
        private readonly router: Router
    ) {}

    podeSalvar(): boolean {
        return !this.salvando() && !!this.senhaAtual && this.novaSenha.length >= 6 && this.novaSenha.length <= 20 && this.novaSenha === this.confirmacaoNovaSenha;
    }

    salvar() {
        if (!this.podeSalvar()) {
            return;
        }

        this.salvando.set(true);

        this.authService.trocarSenha({ senhaAtual: this.senhaAtual, novaSenha: this.novaSenha, confirmacaoNovaSenha: this.confirmacaoNovaSenha }).subscribe({
            next: (resposta) => {
                this.salvando.set(false);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: resposta.items?.mensagem ?? 'Senha alterada com sucesso.', life: 3000 });
                this.router.navigateByUrl(this.authService.rotaInicial());
            },
            error: () => this.salvando.set(false)
        });
    }

    cancelar() {
        this.router.navigateByUrl(this.authService.rotaInicial());
    }

    sair() {
        this.authService.logout();
    }
}
