export type PerfilUsuario = 'Administrador' | 'Operador' | 'Participante';

export interface UsuarioLogado {
    id: string;
    nome: string;
    tipo: PerfilUsuario;
    flagTrocarSenha: boolean;
}

export interface LoginResponse extends UsuarioLogado {
    expiracao: string;
}

export interface TrocarSenhaRequest {
    senhaAtual: string;
    novaSenha: string;
    confirmacaoNovaSenha: string;
}
