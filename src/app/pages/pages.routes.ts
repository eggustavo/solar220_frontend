import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { ParticipanteForm } from './participante/formulario/participante-form';
import { ParticipanteList } from './participante/listar/participante-list';
import { MovimentoForm } from './movimento/formulario/movimento-form';
import { MovimentoList } from './movimento/listar/movimento-list';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'empty', component: Empty },
    { path: 'participantes', component: ParticipanteList },
    { path: 'participantes/novo', component: ParticipanteForm },
    { path: 'participantes/editar/:id', component: ParticipanteForm },
    { path: 'movimentos', component: MovimentoList },
    { path: 'movimentos/novo', component: MovimentoForm },
    { path: 'movimentos/editar/:id', component: MovimentoForm },    
    { path: '**', redirectTo: '/notfound' }
] as Routes;
