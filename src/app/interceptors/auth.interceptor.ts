import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Envia o cookie de autenticação (HttpOnly) nas chamadas à API e trata sessão expirada (401).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    if (!req.url.startsWith(environment.apiUrl)) {
        return next(req);
    }

    const authService = inject(AuthService);
    const router = inject(Router);
    const messageService = inject(MessageService);

    return next(req.clone({ withCredentials: true })).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !req.url.endsWith('/Seguranca/login')) {
                // Evita mensagens repetidas quando várias requisições falham ao mesmo tempo
                if (authService.autenticado()) {
                    messageService.add({ severity: 'warn', summary: 'Sessão expirada', detail: 'Faça login novamente para continuar.', life: 5000 });
                }

                authService.encerrarSessao();

                if (!router.url.startsWith('/auth/login')) {
                    router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
                }
            }

            return throwError(() => error);
        })
    );
};
