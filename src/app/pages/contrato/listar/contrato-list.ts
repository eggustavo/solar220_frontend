import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ContratoService } from '@/app/services/contrato.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-contrato-list',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, ButtonModule, ToolbarModule, TooltipModule, ConfirmDialogModule],
    templateUrl: './contrato-list.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [ConfirmationService]
})
export class ContratoList implements OnInit {
    contratos = signal<any[]>([]);

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
                this.contratos.set(resposta.items ?? []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
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
