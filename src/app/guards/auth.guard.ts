import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const user = await this.auth.getCurrentUser();
    if (user) return true;

    // Redirige al login si no está autenticado
    this.router.navigate(['/login']);
    return false;
  }
}
 