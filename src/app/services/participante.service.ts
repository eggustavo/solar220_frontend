import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespostaApi } from '../models/respostaApi.model';

@Injectable({ providedIn: 'root' })
export class ParticipanteService {
    private readonly apiUrl = `${environment.apiUrl}/Participante`;

    constructor(private readonly http: HttpClient) {}

    listar(): Observable<RespostaApi<any>> {
        return this.http.get<RespostaApi<any>>(`${this.apiUrl}/listar`);
    }

    obter(id: string): Observable<RespostaApi<any>> {
        return this.http.get<RespostaApi<any>>(`${this.apiUrl}/obter/${id}`);
    }

    adicionar(request: any): Observable<RespostaApi<any>> {
        return this.http.post<RespostaApi<any>>(`${this.apiUrl}/adicionar`, request);
    }

    atualizar(request: any): Observable<RespostaApi<any>> {
        return this.http.put<RespostaApi<any>>(`${this.apiUrl}/atualizar`, request);
    }

    excluir(id: string): Observable<RespostaApi<any>> {
        return this.http.delete<RespostaApi<any>>(`${this.apiUrl}/excluir/${id}`);
    }
}
