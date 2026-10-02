import { Injectable } from '@angular/core';

@Injectable()
export class StatusContratoService {
    listar() {
        return [
            {
                id: 'Ativo',
                descricao: 'Ativo'
            },
            {
                id: 'Inativo',
                descricao: 'Inativo'
            },
            {
                id: 'EmDigitacao',
                descricao: 'Em Digitação'
            }
        ];
    }
}
