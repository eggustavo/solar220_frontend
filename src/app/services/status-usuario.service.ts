import { Injectable } from '@angular/core';

@Injectable()
export class StatusUsuarioService {
    listar() {
        return [
            {
                id: 'Ativo',
                descricao: 'Ativo'
            },
            {
                id: 'Inativo',
                descricao: 'Inativo'
            }
        ];
    }
}
