import { Injectable } from '@angular/core';

@Injectable()
export class BandeiraTipoCobrancaService {
    listar() {
        return [
            {
                id: 'BandeiraAntesDoDesconto',
                descricao: 'Bandeira antes do desconto'
            },
            {
                id: 'BandeiraAposDesconto',
                descricao: 'Bandeira após o desconto'
            },
            {
                id: 'BandeiraSobreValorRecebido220',
                descricao: 'Bandeira sobre valor recebido pela 220'
            }
        ];
    }
}
