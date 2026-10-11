import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespostaApi } from '../models/respostaApi.model';

@Injectable({ providedIn: 'root' })
export class ParticipanteUsuarioService {
    private readonly apiUrl = `${environment.apiUrl}/ParticipanteUsuario`;

    constructor(private readonly http: HttpClient) {}

    listar(participanteId: string): Observable<RespostaApi<any[]>> {
        return this.http.get<RespostaApi<any[]>>(`${this.apiUrl}/listar/${participanteId}`);
    }

    listarDisponiveis(participanteId: string): Observable<RespostaApi<any[]>> {
        return this.http.get<RespostaApi<any[]>>(`${this.apiUrl}/listar-disponiveis/${participanteId}`);
    }

    adicionar(request: { participanteId: string; nome: string; email: string; login: string }): Observable<RespostaApi<any>> {
        return this.http.post<RespostaApi<any>>(`${this.apiUrl}/adicionar`, request);
    }

    vincular(request: { participanteId: string; usuarioId: string }): Observable<RespostaApi<any>> {
        return this.http.post<RespostaApi<any>>(`${this.apiUrl}/vincular`, request);
    }

    excluir(id: string): Observable<RespostaApi<any>> {
        return this.http.delete<RespostaApi<any>>(`${this.apiUrl}/excluir/${id}`);
    }
}
