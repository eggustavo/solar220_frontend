import { Injectable } from '@angular/core';

@Injectable()
export class NotaFiscalTipoEmissaoService {
    listar() {
        return [
            {
                id: 'NaoSeAplica',
                descricao: 'Não se aplica'
            },
            {
                id: 'Emissao220',
                descricao: 'Emissão pela 220'
            },
            {
                id: 'EmissaoCedente',
                descricao: 'Emissão pelo cedente'
            },
            {
                id: 'EmissaoCompartilhadaCusto220',
                descricao: 'Emissão Compartilhada (Custo 220)'
            },
            {
                id: 'EmissaoCompartilhadaCustoCedente',
                descricao: 'Emissão Compartilhada (Custo Cedente)'
            }
        ];
    }
}
