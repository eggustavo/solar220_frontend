import { NotificacaoApi } from '../models/notificacaoApi.model';

export interface RespostaApi<T> {
    sucesso: boolean;
    items?: T;
    notificacoes: NotificacaoApi[];
}