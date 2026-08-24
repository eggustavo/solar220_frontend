import { Injectable } from "@angular/core";

@Injectable()
export class TipoNegociacaoService {
    listar() {
        return [
            {
                id: 'Fixo',
                descricao: 'Fixo'
            },
            {
                id: 'Percentual',
                descricao: 'Percentual'
            }
        ];        
    }
}
