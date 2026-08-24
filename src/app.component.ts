import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, ToastModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <p-toast />
        <router-outlet></router-outlet>
    `
})
export class AppComponent {}
