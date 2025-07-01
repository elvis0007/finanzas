// src/app/components/menu/menu.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule]
})
export class MenuComponent implements OnInit, OnDestroy {
  // Iconos - corregidos para ser más específicos
  icons = {
    home: 'home-outline',
    transactions: 'list-outline', 
    budgets: 'pie-chart-outline',
    goals: 'trophy-outline',
    reports: 'bar-chart-outline',
    profile: 'person-outline',
    logout: 'log-out-outline',
    moon: 'moon-outline',
    sunny: 'sunny-outline',
    notifications: 'notifications-outline'
  };

  // Estados reactivos
  isDarkMode = false;
  notificationsEnabled = true;
  userAvatar = 'assets/icon/avatar.png';
  pendingTransactions = 0;
  goalProgress = 0;

  private themeSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.initializeTheme();
    this.loadUserData();
    this.loadPendingData();
  }

  ngOnDestroy() {
    this.themeSubscription?.unsubscribe();
  }

  toggleTheme() {
    this.themeService.toggleDarkMode();
  }

  toggleNotifications() {
    this.notificationsEnabled = !this.notificationsEnabled;
    // Aquí puedes agregar lógica para guardar la preferencia
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  private initializeTheme() {
    this.themeSubscription = this.themeService.darkMode$.subscribe(
      isDark => this.isDarkMode = isDark
    );
  }

  private async loadUserData() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user?.photoURL) {
        this.userAvatar = user.photoURL;
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    }
  }

  private loadPendingData() {
    // Simular datos - reemplaza con tu lógica real
    this.pendingTransactions = 3;
    this.goalProgress = 65;
  }
}