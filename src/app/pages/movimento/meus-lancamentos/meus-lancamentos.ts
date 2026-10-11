import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MovimentoService } from '@/app/services/movimento.service';
import { MovimentoAnexoService } from '@/app/services/movimento-anexo.service';
import { StatusMovimentoService } from '@/app/services/status-movimento.service';
import { FilterService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';
import { Popover, PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

const CHAVE_MES_REFERENCIA = 'meus-lancamentos.mesAnoReferencia';

@Component({
    selector: 'app-meus-lancamentos',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, TagModule, ButtonModule, ToolbarModule, TooltipModule, MenuModule, DialogModule, SelectModule, PopoverModule],
    templateUrl: './meus-lancamentos.html',
    styleUrl: './meus-lancamentos.scss',
    changeDetection: ChangeDetectionStrategy.Eager
})
export class MeusLancamentos implements OnInit {
    movimentos = signal<any[]>([]);
    statusMovimento = signal<any[]>([]);
    mesesReferencia = signal<{ mesAnoReferencia: string }[]>([]);
    mesReferenciaSelecionado = signal<string | null>(null);

    emailSelecionado = signal<any>(null);

    loading = signal<boolean>(false);

    menuItems: MenuItem[] = [];

    anexosVisivel = signal<boolean>(false);
    anexos = signal<any[]>([]);
    anexosCarregando = signal<boolean>(false);
    movimentoSelecionadoParaAnexo: any = null;

    constructor(
        private readonly movimentoService: MovimentoService,
        private readonly movimentoAnexoService: MovimentoAnexoService,
        private readonly statusMovimentoService: StatusMovimentoService,
        private readonly messageService: MessageService,
        private readonly filterService: FilterService,
        private readonly router: Router
    ) {}

    ngOnInit() {
        this.filterService.register('beneficiarioNomeOuUc', (contrato: any, filtro: string) => this.nomeOuUcContem(contrato?.beneficiario?.nome, contrato?.beneficiarioNumeroUc, filtro));
        this.filterService.register('cedenteNomeOuUc', (contrato: any, filtro: string) => this.nomeOuUcContem(contrato?.cedente?.nome, contrato?.cedenteNumeroUc, filtro));

        this.statusMovimentoService.listar().subscribe((status) => this.statusMovimento.set(status));
        this.movimentoService.listarMesesReferenciaMeusLancamentos().subscribe((resposta) => {
            const meses = resposta.items ?? [];
            this.mesesReferencia.set(meses);
            // Restaura o mês escolhido nesta sessão; se não houver (ou não existir mais na lista), usa o primeiro
            const mesSalvo = this.lerMesReferenciaSalvo();
            const mesInicial = meses.some((mes) => mes.mesAnoReferencia === mesSalvo) ? mesSalvo : (meses[0]?.mesAnoReferencia ?? null);
            this.selecionarMesReferencia(mesInicial);
        });
    }

    private nomeOuUcContem(nome: string | null | undefined, uc: string | number | null | undefined, filtro: string): boolean {
        if (!filtro?.trim()) {
            return true;
        }

        const termo = filtro.trim().toLowerCase();

        return (nome ?? '').toLowerCase().includes(termo) || String(uc ?? '').toLowerCase().includes(termo);
    }

    selecionarMesReferencia(mesAnoReferencia: string | null) {
        this.mesReferenciaSelecionado.set(mesAnoReferencia);
        this.salvarMesReferencia(mesAnoReferencia);
        this.carregarMovimentos();
    }

    private lerMesReferenciaSalvo(): string | null {
        try {
            return sessionStorage.getItem(CHAVE_MES_REFERENCIA);
        } catch {
            return null;
        }
    }

    private salvarMesReferencia(mesAnoReferencia: string | null) {
        try {
            if (mesAnoReferencia) {
                sessionStorage.setItem(CHAVE_MES_REFERENCIA, mesAnoReferencia);
            } else {
                sessionStorage.removeItem(CHAVE_MES_REFERENCIA);
            }
        } catch {
            // sessionStorage indisponível (ex.: bloqueado pelo navegador): segue sem persistir
        }
    }

    carregarMovimentos() {
        const mesAnoReferencia = this.mesReferenciaSelecionado();

        if (!mesAnoReferencia) {
            this.movimentos.set([]);
            return;
        }

        this.loading.set(true);

        this.movimentoService.listarMeusLancamentos(mesAnoReferencia).subscribe({
            next: (resposta) => {
                this.movimentos.set(resposta.items ?? []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    visualizar(movimento: any) {
        this.router.navigate(['/pages/meus-lancamentos/visualizar', movimento.id]);
    }

    abrirMenuAcoes(event: Event, movimento: any, menu: any) {
        this.menuItems = [
            { label: 'Visualizar', icon: 'pi pi-eye', command: () => this.visualizar(movimento) },
            { label: 'Ver Anexos', icon: 'pi pi-paperclip', command: () => this.abrirAnexos(movimento) },
            { label: 'Relatório Beneficiário', icon: 'pi pi-file-pdf', command: () => this.imprimirDemonstrativo(movimento, 0) }
        ];
        menu.toggle(event);
    }

    abrirAnexos(movimento: any) {
        this.movimentoSelecionadoParaAnexo = movimento;
        this.anexosVisivel.set(true);
        this.carregarAnexos();
    }

    private carregarAnexos() {
        this.anexosCarregando.set(true);

        this.movimentoAnexoService.listar(this.movimentoSelecionadoParaAnexo.id).subscribe({
            next: (resposta) => {
                this.anexos.set(resposta.items ?? []);
                this.anexosCarregando.set(false);
            },
            error: () => this.anexosCarregando.set(false)
        });
    }

    baixarAnexo(anexo: any) {
        this.movimentoAnexoService.baixar(anexo.id).subscribe({
            next: (resposta) => {
                const file = new Blob([resposta], { type: anexo.tipoConteudo || resposta.type });
                const fileURL = URL.createObjectURL(file);
                window.open(fileURL);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível baixar o anexo.', life: 3000 });
            }
        });
    }

    formatarTamanho(bytes: number): string {
        if (!bytes) {
            return '0 KB';
        }

        const kb = bytes / 1024;

        if (kb < 1024) {
            return `${kb.toFixed(1)} KB`;
        }

        return `${(kb / 1024).toFixed(1)} MB`;
    }

    imprimirDemonstrativo(movimento: any, flagCedente: number) {
        this.loading.set(true);

        this.movimentoService.gerarDemonstrativo(movimento.contrato.contratoId ?? movimento.contrato?.id, flagCedente, movimento.mesAnoReferencia, movimento.id).subscribe({
            next: (resposta: any) => {
                const file = new Blob([resposta], { type: 'application/pdf' });
                const fileURL = URL.createObjectURL(file);
                window.open(fileURL);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    iconeStatusEmail(status: string): string {
        switch (status) {
            case 'Enviado':
                return 'pi-check-circle';
            case 'NaoEnviado':
                return 'pi-times-circle';
            default:
                return 'pi-clock';
        }
    }

    abrirDetalheEmail(event: Event, email: any, popover: Popover) {
        this.emailSelecionado.set(email);
        popover.toggle(event);
    }
}
