import { Routes } from '@angular/router';
import { Access } from './access';
import { Login } from './login';
import { Error } from './error';
import { EsqueciSenha } from './esqueci-senha';
import { visitanteGuard } from '../../guards/auth.guard';

export default [
    { path: 'access', component: Access },
    { path: 'error', component: Error },
    { path: 'login', component: Login, canActivate: [visitanteGuard] },
    { path: 'esqueci-senha', component: EsqueciSenha, canActivate: [visitanteGuard] }
] as Routes;
