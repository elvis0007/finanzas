import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  loading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {}

  async onLogin() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    try {
      await this.authService.login(email!, password!);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Error en inicio de sesión';
    } finally {
      this.loading = false;
    }
  }
  goToRegister() {
  this.router.navigate(['/register']);
}
}
