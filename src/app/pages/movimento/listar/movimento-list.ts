import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MovimentoService } from '@/app/services/movimento.service';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuModule } from 'primeng/menu';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-movimento-list',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, ButtonModule, ToolbarModule, TooltipModule, ConfirmDialogModule, MenuModule],
    templateUrl: './movimento-list.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [ConfirmationService]
})
export class MovimentoList implements OnInit {
    movimentos = signal<any[]>([]);

    loading = signal<boolean>(false);

    menuItems: MenuItem[] = [];

    constructor(
        private readonly movimentoService: MovimentoService,
        private readonly confirmationService: ConfirmationService,
        private readonly messageService: MessageService,
        private readonly router: Router
    ) {}

    ngOnInit() {
        this.carregarMovimentos();
    }

    carregarMovimentos() {
        this.loading.set(true);

        this.movimentoService.listar().subscribe({
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
            { label: 'Relatório Cedente', icon: 'pi pi-print', command: () => this.imprimirDemonstrativo(movimento, 1) },
            { label: 'Relatório Beneficiário', icon: 'pi pi-file-pdf', command: () => this.imprimirDemonstrativo(movimento, 0) },
            { label: 'Enviar por E-mail', icon: 'pi pi-envelope', command: () => this.enviarPorEmail(movimento) }
        ];
        menu.toggle(event);
    }

    imprimirDemonstrativo(movimento: any, flagCedente: number) {
        this.loading.set(true);

        this.movimentoService.gerarDemonstrativo(movimento.id, flagCedente).subscribe({
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

    excluir(movimento: any) {
        this.confirmationService.confirm({
            header: 'Confirmar exclusão',
            message: `Deseja realmente excluir o movimento "${movimento.participanteBeneficiario.nome} (${movimento.participanteBeneficiario.numeroUc}) - ${movimento.mesAnoReferencia}"?`,
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
