import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '@/app/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator],
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
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Solar 220</div>
                            <span class="text-muted-color font-medium">Acesse sua conta para continuar</span>
                        </div>

                        <form (ngSubmit)="entrar()">
                            <label for="login" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Login</label>
                            <input pInputText id="login" name="login" type="text" placeholder="Seu login" autocomplete="username" class="w-full md:w-120 mb-8" [(ngModel)]="login" [disabled]="entrando()" />

                            <label for="senha" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Senha</label>
                            <p-password inputId="senha" name="senha" [(ngModel)]="senha" placeholder="Sua senha" autocomplete="current-password" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false" [disabled]="entrando()" />

                            <div class="flex items-center justify-end mt-2 mb-8">
                                <a routerLink="/auth/esqueci-senha" class="font-medium no-underline text-right cursor-pointer text-primary">Esqueci minha senha</a>
                            </div>
                            <p-button type="submit" label="Entrar" icon="pi pi-sign-in" styleClass="w-full" [loading]="entrando()" [disabled]="!login.trim() || !senha" />
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    login = '';

    senha = '';

    entrando = signal<boolean>(false);

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router,
        private readonly route: ActivatedRoute
    ) {}

    entrar() {
        if (!this.login.trim() || !this.senha || this.entrando()) {
            return;
        }

        this.entrando.set(true);

        this.authService.login(this.login.trim(), this.senha).subscribe({
            next: (resposta) => {
                this.entrando.set(false);

                // Senha provisória: o guard redireciona para a troca de senha
                const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
                this.router.navigateByUrl(resposta.items?.flagTrocarSenha ? '/trocar-senha' : (returnUrl ?? this.authService.rotaInicial()));
            },
            error: () => {
                this.entrando.set(false);
                this.senha = '';
            }
        });
    }
}
