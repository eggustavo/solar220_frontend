import { Injectable } from '@angular/core';

@Injectable()
export class TipoUsuarioService {
    listar() {
        return [
            {
                id: 'Administrador',
                descricao: 'Administrador'
            },
            {
                id: 'Operador',
                descricao: 'Operador'
            },
            {
                id: 'Participante',
                descricao: 'Participante'
            }
        ];
    }
}
