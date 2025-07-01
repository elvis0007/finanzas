import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonApp, IonRouterOutlet, IonMenu } from '@ionic/angular/standalone';
import { MenuComponent } from './components/menu/menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet, IonMenu, RouterModule, MenuComponent],
})
export class AppComponent {
  constructor() {
    this.setInitialTheme();
  }

  setInitialTheme() {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const darkMode = stored === 'dark' || (!stored && prefersDark);
    document.body.classList.toggle('dark', darkMode);
  }

  onThemeToggle(darkMode: boolean) {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }
}
