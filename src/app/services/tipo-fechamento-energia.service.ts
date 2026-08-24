import { Injectable } from "@angular/core";

@Injectable()
export class TipoFechamentoEnergiaService {
    listar() {
        return [
            {
                id: 'Acumulado',
                descricao: 'Acumulado'
            },
            {
                id: 'Excedente',
                descricao: 'Excedente'
            }
        ];        
    }
}
