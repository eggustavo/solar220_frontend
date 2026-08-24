import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `<div class="layout-footer">
        SOLAR 220v by EM3 Soft (16) 9.9207-1919
        <!-- <a href="https://primeng.org" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">PrimeNG</a> -->
    </div>`
})
export class AppFooter {}
