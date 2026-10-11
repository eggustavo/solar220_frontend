import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '@/app/services/auth.service';

@Component({
    selector: 'app-esqueci-senha',
    standalone: true,
    imports: [ButtonModule, InputTextModule, MessageModule, FormsModule, RouterModule, AppFloatingConfigurator],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <i class="pi pi-lock text-primary mb-6" style="font-size: 3rem"></i>
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Esqueci minha senha</div>
                            <span class="text-muted-color font-medium block md:w-120">Informe seu login ou e-mail. Enviaremos uma senha provisória para o e-mail cadastrado.</span>
                        </div>

                        @if (mensagemSucesso(); as mensagem) {
                            <p-message severity="success" styleClass="mb-8 md:w-120">{{ mensagem }}</p-message>
                            <p-button label="Voltar para o login" icon="pi pi-arrow-left" styleClass="w-full" routerLink="/auth/login" />
                        } @else {
                            <form (ngSubmit)="enviar()">
                                <label for="identificacao" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Login ou e-mail</label>
                                <input pInputText id="identificacao" name="identificacao" type="text" placeholder="Seu login ou e-mail" class="w-full md:w-120 mb-8" [(ngModel)]="identificacao" [disabled]="enviando()" />

                                <p-button type="submit" label="Enviar senha provisória" icon="pi pi-envelope" styleClass="w-full mb-6" [loading]="enviando()" [disabled]="!identificacao.trim()" />
                                <div class="text-center">
                                    <a routerLink="/auth/login" class="font-medium no-underline cursor-pointer text-primary"><i class="pi pi-arrow-left text-sm mr-1"></i>Voltar para o login</a>
                                </div>
                            </form>
                        }
                    </div>
                </div>
            </div>
        </div>
    `
})
export class EsqueciSenha {
    identificacao = '';

    enviando = signal<boolean>(false);
    mensagemSucesso = signal<string | null>(null);

    constructor(private readonly authService: AuthService) {}

    enviar() {
        if (!this.identificacao.trim() || this.enviando()) {
            return;
        }

        this.enviando.set(true);

        this.authService.esqueciSenha(this.identificacao.trim()).subscribe({
            next: (resposta) => {
                this.enviando.set(false);
                this.mensagemSucesso.set(resposta.items?.mensagem ?? 'Se os dados informados estiverem cadastrados, você receberá um e-mail com uma senha provisória.');
            },
            error: () => this.enviando.set(false)
        });
    }
}
