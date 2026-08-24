import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { CepModel } from '../models/cep.model';

@Injectable({ providedIn: 'root' })
export class CepService {
  private readonly http: HttpClient;
  private readonly baseUrl = 'https://viacep.com.br/ws';

  constructor(httpBackend: HttpBackend) {
    // ViaCEP é um serviço público; ao usar HttpBackend evitamos interceptors
    // (ex: AuthInterceptor) que poderiam adicionar headers e causar problemas.
    this.http = new HttpClient(httpBackend);
  }

  /**
   * Busca um CEP no ViaCEP.
   * - Aceita CEP com máscara (ex: 01310-000)
   * - Normaliza para 8 dígitos
   */
  buscarCep(cep: string): Observable<CepModel> {
    const normalized = this.normalizeCep(cep);
    if (!normalized) {
      return throwError(() => new Error('CEP inválido. Informe 8 dígitos.'));
    }

    const url = `${this.baseUrl}/${normalized}/json/`;

    return this.http.get<CepModel>(url).pipe(
      map((response) => {
        if (!response) {
          throw new Error('Resposta vazia ao consultar CEP.');
        }
        if ((response as CepModel).erro) {
          throw new Error('CEP não encontrado.');
        }
        return response;
      }),
      catchError((err) => throwError(() => err))
    );
  }

  private normalizeCep(value: string): string | null {
    const digits = (value ?? '').toString().replace(/\D/g, '');
    if (digits.length !== 8) return null;
    return digits;
  }
}
