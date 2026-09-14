import { Injectable } from '@angular/core';

@Injectable()
export class BaseCalculoService {
    listar() {
        return [
            {
                id: 'SobreValorBruto',
                descricao: 'Sobre valor bruto'
            },
            {
                id: 'SobreValorLiquido',
                descricao: 'Sobre valor líquido'
            }
        ];
    }
}
