import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespostaApi } from '../models/respostaApi.model';

@Injectable({ providedIn: 'root' })
export class MovimentoAnexoService {
    private readonly apiUrl = `${environment.apiUrl}/MovimentoAnexo`;

    constructor(private readonly http: HttpClient) {}

    listar(movimentoId: string): Observable<RespostaApi<any[]>> {
        return this.http.get<RespostaApi<any[]>>(`${this.apiUrl}/listar/${movimentoId}`);
    }

    adicionar(movimentoId: string, arquivo: File): Observable<RespostaApi<any>> {
        const formData = new FormData();
        formData.append('MovimentoId', movimentoId);
        formData.append('Arquivo', arquivo);

        return this.http.post<RespostaApi<any>>(`${this.apiUrl}/adicionar`, formData);
    }

    excluir(id: string): Observable<RespostaApi<any>> {
        return this.http.delete<RespostaApi<any>>(`${this.apiUrl}/excluir/${id}`);
    }

    baixar(id: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/download/${id}`, { responseType: 'blob' });
    }
}
