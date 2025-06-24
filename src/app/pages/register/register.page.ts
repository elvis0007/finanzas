import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss']
})
export class RegisterPage {
  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: this.passwordsMatchValidator
  });

  loading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {}

  passwordsMatchValidator(group: any) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { notMatching: true };
  }

  async onRegister() {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.registerForm.value;

    try {
      await this.authService.register(email!, password!);
      // Opcional: redirigir a login o dashboard
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Error en registro';
    } finally {
      this.loading = false;
    }
  }
}
