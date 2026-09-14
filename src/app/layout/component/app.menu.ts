import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            },
            {
                label: 'Cadastros',
                icon: 'pi pi-fw pi-briefcase',
                path: '/pages',
                items: [
                    {
                        label: 'Participantes',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/pages/participantes']
                    },
                    {
                        label: 'Contratos',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/pages/contratos']
                    }
                ]
            },
            {
                label: 'Lançamentos',
                icon: 'pi pi-fw pi-briefcase',
                path: '/pages',
                items: [
                    {
                        label: 'Lançamentos',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/pages/movimentos']
                    }
                ]
            }            
        ];
    }
}
