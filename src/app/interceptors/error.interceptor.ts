import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { NotificacaoApi } from '../models/notificacaoApi.model';
import { RespostaApi } from '../models/respostaApi.model';
import { environment } from '../../environments/environment';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    if (!req.url.startsWith(environment.apiUrl)) {
        return next(req);
    }

    const messageService = inject(MessageService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            const notificacoes = extrairNotificacoes(error);
            const detail = notificacoes.length > 0 ? notificacoes.map((notificacao) => notificacao.message).join(' ') : 'Não foi possível concluir a requisição.';

            notificacoes.forEach((notificacao) => console.error(`[API] ${notificacao.property}: ${notificacao.message}`));
            if (notificacoes.length === 0) {
                console.error('[API] Erro inesperado na requisição.', error);
            }

            messageService.add({ severity: 'error', summary: 'Erro', detail, life: 5000 });

            return throwError(() => error);
        })
    );
};

export function extrairNotificacoes(error: HttpErrorResponse): NotificacaoApi[] {
    const resposta = error.error as RespostaApi<unknown> | null;
    return resposta?.notificacoes ?? [];
}
