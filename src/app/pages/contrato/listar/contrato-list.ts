import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContratoService } from '@/app/services/contrato.service';
import { StatusContratoService } from '@/app/services/status-contrato.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-contrato-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, TagModule, ButtonModule, ToolbarModule, TooltipModule, ConfirmDialogModule, SelectModule],
    templateUrl: './contrato-list.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [ConfirmationService, StatusContratoService]
})
export class ContratoList implements OnInit {
    contratos = signal<any[]>([]);
    statusContrato = signal<any[]>(inject(StatusContratoService).listar());

    loading = signal<boolean>(false);

    constructor(
        private readonly contratoService: ContratoService,
        private readonly confirmationService: ConfirmationService,
        private readonly messageService: MessageService,
        private readonly router: Router
    ) {}

    ngOnInit() {
        this.carregarContratos();
    }

    carregarContratos() {
        this.loading.set(true);

        this.contratoService.listar().subscribe({
            next: (resposta) => {
                const contratos = (resposta.items ?? []).map((contrato: any) => ({
                    ...contrato,
                    dataInicioOperacao: this.paraData(contrato.dataInicioOperacao)
                }));
                this.contratos.set(contratos);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    /** Converte 'yyyy-MM-dd' em Date local (necessário para o filtro de data do p-table) */
    private paraData(valor: string | null | undefined): Date | null {
        if (!valor) {
            return null;
        }
        const [ano, mes, dia] = valor.split('-').map(Number);
        return new Date(ano, mes - 1, dia);
    }

    adicionar() {
        this.router.navigate(['/pages/contratos/novo']);
    }

    editar(contrato: any) {
        this.router.navigate(['/pages/contratos/editar', contrato.id]);
    }

    excluir(contrato: any) {
        this.confirmationService.confirm({
            header: 'Confirmar exclusão',
            message: `Deseja realmente excluir o contrato "${contrato.cedenteNumeroUc ?? contrato.id}"?`,
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger', label: 'Excluir' },
            rejectButtonProps: { severity: 'secondary', outlined: true, label: 'Cancelar' },
            accept: () => {
                this.contratoService.excluir(contrato.id).subscribe({
                    next: (resposta) => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: resposta.items?.mensagem ?? 'Contrato excluído com sucesso.', life: 3000 });
                        this.carregarContratos();
                    },
                    error: () => {}
                });
            }
        });
    }
}
