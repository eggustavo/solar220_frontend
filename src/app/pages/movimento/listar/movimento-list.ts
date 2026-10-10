import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MovimentoService } from '@/app/services/movimento.service';
import { MovimentoAnexoService } from '@/app/services/movimento-anexo.service';
import { StatusMovimentoService } from '@/app/services/status-movimento.service';
import { ConfirmationService, FilterService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule, FileUploadHandlerEvent } from 'primeng/fileupload';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-movimento-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, TagModule, ButtonModule, ToolbarModule, TooltipModule, ConfirmDialogModule, MenuModule, DialogModule, FileUploadModule, SelectModule],
    templateUrl: './movimento-list.html',
    styleUrl: './movimento-list.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [ConfirmationService]
})
export class MovimentoList implements OnInit {
    movimentos = signal<any[]>([]);
    statusMovimento = signal<any[]>([]);
    mesesReferencia = signal<{ mesAnoReferencia: string }[]>([]);
    mesReferenciaSelecionado = signal<string | null>(null);
    movimentosSelecionados = signal<any[]>([]);

    alterarStatusVisivel = signal<boolean>(false);
    novoStatus = signal<string | null>(null);
    alterandoStatus = signal<boolean>(false);

    loading = signal<boolean>(false);

    menuItems: MenuItem[] = [];

    anexosVisivel = signal<boolean>(false);
    anexos = signal<any[]>([]);
    anexosCarregando = signal<boolean>(false);
    anexoEnviando = signal<boolean>(false);
    movimentoSelecionadoParaAnexo: any = null;

    constructor(
        private readonly movimentoService: MovimentoService,
        private readonly movimentoAnexoService: MovimentoAnexoService,
        private readonly statusMovimentoService: StatusMovimentoService,
        private readonly confirmationService: ConfirmationService,
        private readonly messageService: MessageService,
        private readonly filterService: FilterService,
        private readonly router: Router
    ) {}

    ngOnInit() {
        this.filterService.register('beneficiarioNomeOuUc', (contrato: any, filtro: string) => this.nomeOuUcContem(contrato?.beneficiario?.nome, contrato?.beneficiarioNumeroUc, filtro));
        this.filterService.register('cedenteNomeOuUc', (contrato: any, filtro: string) => this.nomeOuUcContem(contrato?.cedente?.nome, contrato?.cedenteNumeroUc, filtro));

        this.statusMovimentoService.listar().subscribe((status) => this.statusMovimento.set(status));
        this.movimentoService.listarMesesReferencia().subscribe((resposta) => {
            const meses = resposta.items ?? [];
            this.mesesReferencia.set(meses);
            this.selecionarMesReferencia(meses[0]?.mesAnoReferencia ?? null);
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
        this.carregarMovimentos();
    }

    carregarMovimentos() {
        const mesAnoReferencia = this.mesReferenciaSelecionado();

        if (!mesAnoReferencia) {
            this.movimentos.set([]);
            return;
        }

        this.loading.set(true);
        this.movimentosSelecionados.set([]);

        this.movimentoService.listar(mesAnoReferencia).subscribe({
            next: (resposta) => {
                this.movimentos.set(resposta.items ?? []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    adicionar() {
        this.router.navigate(['/pages/movimentos/novo']);
    }

    editar(movimento: any) {
        this.router.navigate(['/pages/movimentos/editar', movimento.id]);
    }

    abrirMenuAcoes(event: Event, movimento: any, menu: any) {
        this.menuItems = [
            { label: 'Editar', icon: 'pi pi-pencil', command: () => this.editar(movimento) },
            { label: 'Excluir', icon: 'pi pi-trash', styleClass: 'text-red-500', command: () => this.excluir(movimento) },
            { separator: true },
            { label: 'Anexar Documentos', icon: 'pi pi-paperclip', command: () => this.abrirAnexos(movimento) },
            { label: 'Relatório Cedente', icon: 'pi pi-print', command: () => this.imprimirDemonstrativo(movimento, 1) },
            { label: 'Relatório Beneficiário', icon: 'pi pi-file-pdf', command: () => this.imprimirDemonstrativo(movimento, 0) },
            { label: 'Enviar por E-mail', icon: 'pi pi-envelope', command: () => this.enviarPorEmail(movimento) }
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

    enviarAnexo(event: FileUploadHandlerEvent, fileUpload: any) {
        const arquivo = event.files[0];

        if (!arquivo) {
            return;
        }

        this.anexoEnviando.set(true);

        this.movimentoAnexoService.adicionar(this.movimentoSelecionadoParaAnexo.id, arquivo).subscribe({
            next: (resposta) => {
                this.anexoEnviando.set(false);
                fileUpload.clear();
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: resposta.items?.mensagem ?? 'Anexo adicionado com sucesso.', life: 3000 });
                this.carregarAnexos();
            },
            error: () => {
                this.anexoEnviando.set(false);
                fileUpload.clear();
            }
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

    excluirAnexo(anexo: any) {
        this.confirmationService.confirm({
            header: 'Confirmar exclusão',
            message: `Deseja realmente excluir o anexo "${anexo.nomeOriginal}"?`,
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger', label: 'Excluir' },
            rejectButtonProps: { severity: 'secondary', outlined: true, label: 'Cancelar' },
            accept: () => {
                this.movimentoAnexoService.excluir(anexo.id).subscribe({
                    next: (resposta) => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: resposta.items?.mensagem ?? 'Anexo excluído com sucesso.', life: 3000 });
                        this.carregarAnexos();
                    },
                    error: () => {}
                });
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

        this.movimentoService.gerarDemonstrativo(movimento.contrato.contratoId ?? movimento.contrato?.id,flagCedente, movimento.mesAnoReferencia, movimento.id).subscribe({
            next: (resposta: any) => {
                const file = new Blob([resposta], { type: 'application/pdf' });
                const fileURL = URL.createObjectURL(file);
                window.open(fileURL);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    enviarPorEmail(movimento: any) {}

    abrirAlterarStatus() {
        this.novoStatus.set(null);
        this.alterarStatusVisivel.set(true);
    }

    confirmarAlterarStatus() {
        const status = this.novoStatus();
        const selecionados = this.movimentosSelecionados();

        if (!status || selecionados.length === 0) {
            return;
        }

        this.alterandoStatus.set(true);

        this.movimentoService.atualizarStatus({ ids: selecionados.map((movimento) => movimento.id), status }).subscribe({
            next: (resposta) => {
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: resposta.items?.mensagem ?? `Status alterado em ${selecionados.length} lançamento(s).`, life: 3000 });
                this.alterandoStatus.set(false);
                this.alterarStatusVisivel.set(false);
                this.carregarMovimentos();
            },
            error: () => {
                this.alterandoStatus.set(false);
                this.carregarMovimentos();
            }
        });
    }

    excluir(movimento: any) {
        this.confirmationService.confirm({
            header: 'Confirmar exclusão',
            message: `Deseja realmente excluir o movimento "${movimento.contrato.beneficiario.nome} (${movimento.contrato.beneficiarioNumeroUc}) - ${movimento.mesAnoReferencia}"?`,
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger', label: 'Excluir' },
            rejectButtonProps: { severity: 'secondary', outlined: true, label: 'Cancelar' },
            accept: () => {
                this.movimentoService.excluir(movimento.id).subscribe({
                    next: (resposta) => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: resposta.items?.mensagem ?? 'Movimento excluído com sucesso.', life: 3000 });
                        this.carregarMovimentos();
                    },
                    error: () => {}
                });
            }
        });
    }
}
