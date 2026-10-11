import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespostaApi } from '../models/respostaApi.model';
import { LoginResponse, PerfilUsuario, TrocarSenhaRequest, UsuarioLogado } from '../models/usuario-logado.model';

// Apenas os dados de exibição do usuário ficam no navegador; o token trafega em cookie HttpOnly (definido pela API)
const CHAVE_USUARIO = 'solar220.usuario';

const ROTA_INICIAL: Record<PerfilUsuario, string> = {
    Administrador: '/',
    Operador: '/pages/movimentos',
    Participante: '/pages/meus-lancamentos'
};

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly apiUrl = `${environment.apiUrl}/Seguranca`;

    private readonly usuarioAtual = signal<UsuarioLogado | null>(this.lerUsuarioSalvo());

    readonly usuario = this.usuarioAtual.asReadonly();
    readonly autenticado = computed(() => this.usuarioAtual() !== null);

    constructor(
        private readonly http: HttpClient,
        private readonly router: Router
    ) {}

    login(login: string, senha: string): Observable<RespostaApi<LoginResponse>> {
        return this.http.post<RespostaApi<LoginResponse>>(`${this.apiUrl}/login`, { login, senha }).pipe(
            tap((resposta) => {
                if (resposta.items) {
                    const { id, nome, tipo, flagTrocarSenha } = resposta.items;
                    this.definirUsuario({ id, nome, tipo, flagTrocarSenha });
                }
            })
        );
    }

    logout() {
        this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
            complete: () => this.finalizarLogout(),
            error: () => this.finalizarLogout()
        });
    }

    /**
     * Limpa os dados do usuário no navegador (ex.: sessão expirada ou logout).
     */
    encerrarSessao() {
        this.usuarioAtual.set(null);

        try {
            localStorage.removeItem(CHAVE_USUARIO);
        } catch {
            // localStorage indisponível: nada a limpar
        }
    }

    esqueciSenha(identificacao: string): Observable<RespostaApi<{ mensagem: string }>> {
        return this.http.post<RespostaApi<{ mensagem: string }>>(`${this.apiUrl}/esqueci-senha`, { identificacao });
    }

    trocarSenha(request: TrocarSenhaRequest): Observable<RespostaApi<{ mensagem: string }>> {
        return this.http.post<RespostaApi<{ mensagem: string }>>(`${this.apiUrl}/trocar-senha`, request).pipe(
            tap(() => {
                const usuario = this.usuarioAtual();
                if (usuario) {
                    this.definirUsuario({ ...usuario, flagTrocarSenha: false });
                }
            })
        );
    }

    /**
     * Administrador tem acesso a tudo; os demais perfis somente às telas que os incluem.
     */
    possuiPerfil(perfis: PerfilUsuario[]): boolean {
        const tipo = this.usuarioAtual()?.tipo;

        if (!tipo) {
            return false;
        }

        return tipo === 'Administrador' || perfis.includes(tipo);
    }

    rotaInicial(): string {
        const tipo = this.usuarioAtual()?.tipo;
        return tipo ? ROTA_INICIAL[tipo] : '/auth/login';
    }

    private finalizarLogout() {
        this.encerrarSessao();
        this.router.navigate(['/auth/login']);
    }

    private definirUsuario(usuario: UsuarioLogado) {
        this.usuarioAtual.set(usuario);

        try {
            localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
        } catch {
            // localStorage indisponível: o usuário fica apenas em memória
        }
    }

    private lerUsuarioSalvo(): UsuarioLogado | null {
        try {
            const valor = localStorage.getItem(CHAVE_USUARIO);
            return valor ? (JSON.parse(valor) as UsuarioLogado) : null;
        } catch {
            return null;
        }
    }
}
