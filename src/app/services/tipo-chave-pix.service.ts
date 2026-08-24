import { Injectable } from "@angular/core";

@Injectable()
export class TipoChavePixService {
    listar() {
        return [
            {
                id: 'CPF',
                descricao: 'CPF'
            },
            {
                id: 'CNPJ',
                descricao: 'CNPJ'
            },
            {
                id: 'Email',
                descricao: 'E-mail'
            },
            {
                id: 'Celular',
                descricao: 'Número de celular'
            },
            {
                id: 'ChaveAleatoria',
                descricao: 'Chave Aleatória'
            }
        ];        
    }
}
