import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespostaApi } from '../models/respostaApi.model';

@Injectable({ providedIn: 'root' })
export class MovimentoEmailService {
    private readonly apiUrl = `${environment.apiUrl}/MovimentoEmail`;

    constructor(private readonly http: HttpClient) {}

    solicitar(ids: string[]): Observable<RespostaApi<any>> {
        return this.http.post<RespostaApi<any>>(`${this.apiUrl}/solicitar`, { ids });
    }
}
