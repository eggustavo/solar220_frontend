import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localePtBr from '@angular/common/locales/pt';
import { ApplicationConfig, LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { errorInterceptor } from './app/interceptors/error.interceptor';
import { PRIMENG_PT_BR } from './app/locale/primeng-pt-br';

registerLocaleData(localePtBr, 'pt-BR');

// Cor primária padrão: yellow (a mesma definida em LayoutService.layoutConfig.primary, evitando o 'flash' da cor padrão do Aura)
const Solar220Preset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{yellow.50}',
            100: '{yellow.100}',
            200: '{yellow.200}',
            300: '{yellow.300}',
            400: '{yellow.400}',
            500: '{yellow.500}',
            600: '{yellow.600}',
            700: '{yellow.700}',
            800: '{yellow.800}',
            900: '{yellow.900}',
            950: '{yellow.950}'
        }
    }
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
        provideZonelessChangeDetection(),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        providePrimeNG(
            {
                theme:
                {
                    preset: Solar220Preset,
                    options:
                    {
                        darkModeSelector: '.app-dark'
                    }
                },
                translation: PRIMENG_PT_BR,
                license: 'eyJpZCI6ImM2MjIxZDZjLTc3ODEtNDg1MS1hZjlkLTdkMWVjMTkzZDY4MSIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODY3NDgzNTcsImV4cCI6MTgxODI4NDM1N30.dQcPEmnY8Eri6WSEVHaNnrnuDE9WEn6rGw3d5K46FqJ6zHbXfX7OvxqHkscsX38O_BYrzq8OKtYaqMjNgHRTAQ'
            }),
        MessageService
    ]
};
