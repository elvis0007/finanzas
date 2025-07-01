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
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private authService: AuthService
  ) {}

  /**
   * Maneja el envío del formulario de login
   */
  async onLogin() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    try {
      await this.authService.login(email!, password!);
      
      // Pequeña animación de éxito antes de navegar
      this.showSuccessAnimation();
      
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 500);
      
    } catch (error: any) {
      this.handleLoginError(error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Navega a la página de registro
   */
  goToRegister() {
    this.router.navigate(['/register']);
  }

  /**
   * Navega a la página de recuperación de contraseña
   */
  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Marca todos los campos del formulario como tocados para mostrar errores
   */
  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Maneja los errores de login y muestra mensajes apropiados
   */
  private handleLoginError(error: any) {
    // Mapear diferentes tipos de errores a mensajes amigables
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-email': 'El formato del correo electrónico no es válido',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
      'auth/invalid-credential': 'Credenciales inválidas. Verifica tu correo y contraseña'
    };

    this.errorMessage = errorMessages[error.code] || 
                       error.message || 
                       'Error inesperado. Intenta nuevamente';
  }

  /**
   * Muestra una animación de éxito (puedes personalizarla)
   */
  private showSuccessAnimation() {
    // Aquí puedes agregar una animación personalizada
    // Por ejemplo, cambiar temporalmente el botón a verde
    const button = document.querySelector('.login-button');
    if (button) {
      button.classList.add('success-animation');
      setTimeout(() => {
        button.classList.remove('success-animation');
      }, 1000);
    }
  }

  /**
   * Obtiene el mensaje de error específico para cada campo
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return fieldName === 'email' ? 'El correo electrónico es requerido' : 'La contraseña es requerida';
      }
      if (field.errors['email']) {
        return 'Ingresa un correo electrónico válido';
      }
      if (field.errors['minlength']) {
        return 'La contraseña debe tener al menos 6 caracteres';
      }
    }
    
    return '';
  }

  /**
   * Verifica si un campo específico tiene errores
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }
}