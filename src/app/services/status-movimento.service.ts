import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Nome do EnumStatusMovimento (backend) por id retornado em /Enum/status-movimento
const NOME_POR_ID: Record<number, string> = {
    1: 'NaoConferido',
    2: 'Conferido',
    3: 'EnviadoParaCliente'
};

export interface StatusMovimento {
    id: number;
    nome: string;
    descricao: string;
}

@Injectable({ providedIn: 'root' })
export class StatusMovimentoService {
    private readonly apiUrl = `${environment.apiUrl}/Enum/status-movimento`;

    constructor(private readonly http: HttpClient) {}

    listar(): Observable<StatusMovimento[]> {
        return this.http.get<{ id: number; descricao: string }[]>(this.apiUrl).pipe(map((itens) => itens.map((item) => ({ ...item, nome: NOME_POR_ID[item.id] }))));
    }
}
