import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { logOutOutline, homeOutline, listOutline, personOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  standalone: true,
  imports: [
    IonicModule,
    RouterModule,
  ],
})
export class MenuComponent implements OnInit {
  icons = {
    home: homeOutline,
    transactions: listOutline,
    profile: personOutline,
    logout: logOutOutline,
  };

  @Output() themeToggle = new EventEmitter<boolean>();
  darkMode: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const stored = localStorage.getItem('theme');
    this.darkMode = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  onToggleTheme(event: any) {
    const checked = event.detail.checked;
    this.darkMode = checked;
    this.themeToggle.emit(checked);
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
