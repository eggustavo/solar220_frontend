import { Routes } from '@angular/router';
import { ParticipanteForm } from './participante/formulario/participante-form';
import { ParticipanteList } from './participante/listar/participante-list';
import { MovimentoForm } from './movimento/formulario/movimento-form';
import { MovimentoList } from './movimento/listar/movimento-list';
import { ContratoForm } from './contrato/formulario/contrato-form';
import { ContratoList } from './contrato/listar/contrato-list';

export default [
    { path: 'participantes', component: ParticipanteList },
    { path: 'participantes/novo', component: ParticipanteForm },
    { path: 'participantes/editar/:id', component: ParticipanteForm },
    { path: 'movimentos', component: MovimentoList },
    { path: 'movimentos/novo', component: MovimentoForm },
    { path: 'movimentos/editar/:id', component: MovimentoForm },
    { path: 'contratos', component: ContratoList },
    { path: 'contratos/novo', component: ContratoForm },
    { path: 'contratos/editar/:id', component: ContratoForm },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
