import { Routes } from '@angular/router';
import { MenuComponent } from './components/menu/menu.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MenuComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./pages/transactions/transactions.page').then(m => m.TransactionsPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.page').then(m => m.ProfilePage),
      },
      {
        path: 'pending-payments',
        loadComponent: () =>
          import('./pages/pending-payments/pending-payments.page').then(m => m.PendingPaymentsPage),
      },

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then(m => m.RegisterPage),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
