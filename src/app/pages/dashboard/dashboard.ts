import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: 'app-dashboard',
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <div class="flex justify-center items-center">
            <img [src]="layoutService.isDarkTheme() ? 'images/logo-branca.png' : 'images/logo-preta.png'" alt="Solar 220v" style="width: 75%" />
        </div>
    `
})
export class Dashboard {
    layoutService = inject(LayoutService);
}
