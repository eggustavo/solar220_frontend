import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { authGuard } from './app/guards/auth.guard';
import { TrocarSenha } from './app/pages/seguranca/trocar-senha';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        children: [
            { path: '', component: Dashboard, data: { perfis: ['Administrador'] } },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    // Fora do layout (tela cheia, como o login), mas exige usuário autenticado
    { path: 'trocar-senha', component: TrocarSenha, canActivate: [authGuard] },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
