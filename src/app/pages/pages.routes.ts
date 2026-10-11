import { Routes } from '@angular/router';
import { ParticipanteForm } from './participante/formulario/participante-form';
import { ParticipanteList } from './participante/listar/participante-list';
import { MovimentoForm } from './movimento/formulario/movimento-form';
import { MovimentoList } from './movimento/listar/movimento-list';
import { MeusLancamentos } from './movimento/meus-lancamentos/meus-lancamentos';
import { ContratoForm } from './contrato/formulario/contrato-form';
import { ContratoList } from './contrato/listar/contrato-list';
import { UsuarioForm } from './usuario/formulario/usuario-form';
import { UsuarioList } from './usuario/listar/usuario-list';

// Perfis com acesso a cada tela (Administrador acessa todas)
const ADMINISTRADOR = { perfis: ['Administrador'] };
const OPERADOR = { perfis: ['Operador'] };
const PARTICIPANTE = { perfis: ['Participante'] };

export default [
    { path: 'participantes', component: ParticipanteList, data: ADMINISTRADOR },
    { path: 'participantes/novo', component: ParticipanteForm, data: ADMINISTRADOR },
    { path: 'participantes/editar/:id', component: ParticipanteForm, data: ADMINISTRADOR },
    { path: 'movimentos', component: MovimentoList, data: OPERADOR },
    { path: 'movimentos/novo', component: MovimentoForm, data: OPERADOR },
    { path: 'movimentos/editar/:id', component: MovimentoForm, data: OPERADOR },
    { path: 'meus-lancamentos', component: MeusLancamentos, data: PARTICIPANTE },
    { path: 'meus-lancamentos/visualizar/:id', component: MovimentoForm, data: { ...PARTICIPANTE, somenteLeitura: true, rotaVoltar: '/pages/meus-lancamentos' } },
    { path: 'contratos', component: ContratoList, data: ADMINISTRADOR },
    { path: 'contratos/novo', component: ContratoForm, data: ADMINISTRADOR },
    { path: 'contratos/editar/:id', component: ContratoForm, data: ADMINISTRADOR },
    { path: 'usuarios', component: UsuarioList, data: ADMINISTRADOR },
    { path: 'usuarios/novo', component: UsuarioForm, data: ADMINISTRADOR },
    { path: 'usuarios/editar/:id', component: UsuarioForm, data: ADMINISTRADOR },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
