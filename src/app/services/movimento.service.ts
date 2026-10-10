import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespostaApi } from '../models/respostaApi.model';

@Injectable({ providedIn: 'root' })
export class MovimentoService {
    private readonly apiUrl = `${environment.apiUrl}/Movimento`;

    constructor(private readonly http: HttpClient) {}

    listar(mesAnoReferencia: string): Observable<RespostaApi<any>> {
        return this.http.get<RespostaApi<any>>(`${this.apiUrl}/listar`, { params: { MesAnoReferencia: mesAnoReferencia } });
    }

    listarMesesReferencia(): Observable<RespostaApi<{ mesAnoReferencia: string }[]>> {
        return this.http.get<RespostaApi<{ mesAnoReferencia: string }[]>>(`${this.apiUrl}/listar-meses-referencia`);
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

    gerarDemonstrativo(contratoId: string, flagCedente: number, mesAnoReferencia: string, movimentoId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/gerar-demonstrativo`, {
            params: {
                contratoId: contratoId,
                flagCedente: flagCedente,
                mesAnoReferencia: mesAnoReferencia,
                movimentoId: movimentoId,
            },
            responseType: 'blob',
            headers: {
                'accept': '*/*',
            },
        });
    }
}
