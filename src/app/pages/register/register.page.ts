import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), this.passwordStrengthValidator]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]]
  }, {
    validators: this.passwordsMatchValidator
  });

  loading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Maneja el envío del formulario de registro
   */
  async onRegister() {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password, fullName } = this.registerForm.value;

    try {
      await this.authService.register(email!, password!);
      
      // Mostrar animación de éxito
      this.showSuccessAnimation();
      
      setTimeout(() => {
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true', email: email }
        });
      }, 500);
      
    } catch (error: any) {
      this.handleRegisterError(error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Navega a la página de login
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Alterna la visibilidad de la confirmación de contraseña
   */
  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  /**
   * Validador de fortaleza de contraseña
   */
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    
    if (!password) {
      return null;
    }

    const hasNumber = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[#?!@$%^&*-]/.test(password);

    const validConditions = [hasNumber, hasUpper, hasLower, hasSpecial].filter(Boolean).length;

    if (password.length < 8 || validConditions < 2) {
      return { weakPassword: true };
    }

    return null;
  }

  /**
   * Marca todos los campos del formulario como tocados para mostrar errores
   */
  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Maneja los errores de registro y muestra mensajes apropiados
   */
  private handleRegisterError(error: any) {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Ya existe una cuenta con este correo electrónico',
      'auth/weak-password': 'La contraseña es muy débil',
      'auth/invalid-email': 'El formato del correo electrónico no es válido',
      'auth/operation-not-allowed': 'El registro con correo/contraseña no está habilitado',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
    };

    this.errorMessage = errorMessages[error.code] || 
                       error.message || 
                       'Error inesperado durante el registro. Intenta nuevamente';
  }

  /**
   * Muestra una animación de éxito
   */
  private showSuccessAnimation() {
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
    const field = this.registerForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        const fieldMessages: { [key: string]: string } = {
          'fullName': 'El nombre completo es requerido',
          'email': 'El correo electrónico es requerido',
          'password': 'La contraseña es requerida',
          'confirmPassword': 'Confirma tu contraseña',
          'acceptTerms': 'Debes aceptar los términos y condiciones'
        };
        return fieldMessages[fieldName] || 'Este campo es requerido';
      }
      
      if (field.errors['email']) {
        return 'Ingresa un correo electrónico válido';
      }
      
      if (field.errors['minlength']) {
        if (fieldName === 'password') {
          return 'La contraseña debe tener al menos 6 caracteres';
        }
        if (fieldName === 'fullName') {
          return 'El nombre debe tener al menos 2 caracteres';
        }
      }
      
      if (field.errors['weakPassword']) {
        return 'La contraseña debe tener al menos 8 caracteres y incluir mayúsculas, números o símbolos';
      }
      
      if (field.errors['requiredTrue']) {
        return 'Debes aceptar los términos y condiciones';
      }
    }
    
    return '';
  }

  /**
   * Verifica si un campo específico tiene errores
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  /**
   * Verifica si hay error de no coincidencia de contraseñas
   */
  hasPasswordMismatch(): boolean {
    return !!(this.registerForm.errors?.['passwordMismatch'] && 
             this.registerForm.get('confirmPassword')?.touched);
  }

  /**
   * Obtiene el mensaje de error para contraseñas que no coinciden
   */
  getPasswordMismatchError(): string {
    if (this.hasPasswordMismatch()) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }
}