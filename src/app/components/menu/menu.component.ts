import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { logOutOutline, homeOutline, listOutline, personOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service'; // ✅ Importación necesaria

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  standalone: true,
  imports: [
    IonicModule,
    RouterModule,
  ],
})
export class MenuComponent {
  icons = {
    home: homeOutline,
    transactions: listOutline,
    profile: personOutline,
    logout: logOutOutline,
  };

  constructor(
    private authService: AuthService, // ✅ Aquí defines el servicio
    private router: Router
  ) {}

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
