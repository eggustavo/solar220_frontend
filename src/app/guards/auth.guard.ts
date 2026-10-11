import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { PerfilUsuario } from '../models/usuario-logado.model';
import { AuthService } from '../services/auth.service';

export const ROTA_TROCAR_SENHA = '/trocar-senha';

/**
 * Exige usuário autenticado, força a troca de senha provisória e valida o perfil da rota (data.perfis).
 * Sem "perfis" na rota, qualquer usuário autenticado acessa; Administrador acessa tudo.
 */
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const usuario = authService.usuario();

    if (!usuario) {
        return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
    }

    if (usuario.flagTrocarSenha && !state.url.startsWith(ROTA_TROCAR_SENHA)) {
        return router.createUrlTree([ROTA_TROCAR_SENHA]);
    }

    const perfis = route.data?.['perfis'] as PerfilUsuario[] | undefined;

    if (perfis && !authService.possuiPerfil(perfis)) {
        return router.createUrlTree([authService.rotaInicial()]);
    }

    return true;
};

/**
 * Telas públicas de autenticação (login, esqueci minha senha): quem já está logado vai para a sua tela inicial.
 */
export const visitanteGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.autenticado() ? router.createUrlTree([authService.rotaInicial()]) : true;
};
