import { Injectable } from "@angular/core";

@Injectable()
export class TipoRecebimentoSaldoService {
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
