import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ParticipanteService } from '@/app/services/participante.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-participante-list',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, ButtonModule, ToolbarModule, TooltipModule, ConfirmDialogModule],
    templateUrl: './participante-list.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    providers: [ConfirmationService]
})
export class ParticipanteList implements OnInit {
    participantes = signal<any[]>([]);

    loading = signal<boolean>(false);

    constructor(
        private readonly participanteService: ParticipanteService,
        private readonly confirmationService: ConfirmationService,
        private readonly messageService: MessageService,
        private readonly router: Router
    ) {}

    ngOnInit() {
        this.carregarParticipantes();
    }

    carregarParticipantes() {
        this.loading.set(true);

        this.participanteService.listar().subscribe({
            next: (resposta) => {
                this.participantes.set(resposta.items ?? []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    adicionar() {
        this.router.navigate(['/pages/participantes/novo']);
    }

    editar(participante: any) {
        this.router.navigate(['/pages/participantes/editar', participante.id]);
    }

    excluir(participante: any) {
        this.confirmationService.confirm({
            header: 'Confirmar exclusão',
            message: `Deseja realmente excluir o participante "${participante.nome}"?`,
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { severity: 'danger', label: 'Excluir' },
            rejectButtonProps: { severity: 'secondary', outlined: true, label: 'Cancelar' },
            accept: () => {
                this.participanteService.excluir(participante.id).subscribe({
                    next: (resposta) => {
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: resposta.items?.mensagem ?? 'Participante excluído com sucesso.', life: 3000 });
                        this.carregarParticipantes();
                    },
                    error: () => {}
                });
            }
        });
    }
}
