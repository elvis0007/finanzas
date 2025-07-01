import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService, UserProfile } from '../../services/user.service';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule]
})
export class ProfilePage implements OnInit, OnDestroy {
  profileForm: FormGroup;
  userEmail: string = '';
  userId: string = '';
  userInitials: string = '';
  userFullName: string = '';
  isLoading: boolean = false;
  
  private subscription?: Subscription;
  private themeSubscription?: Subscription;
  private isDarkMode = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private themeService: ThemeService,
    private fb: FormBuilder,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  async ngOnInit() {
    // Suscribirse a cambios de tema
    this.themeSubscription = this.themeService.darkMode$.subscribe(
      isDark => {
        this.isDarkMode = isDark;
      }
    );

    // Cargar datos del usuario
    await this.loadUserData();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
  }

  private async loadUserData() {
    try {
      this.isLoading = true;
      const user = await this.authService.getCurrentUser();
      
      if (user) {
        this.userEmail = user.email || '';
        this.userId = user.uid;

        // Cargar datos del perfil
        this.subscription = this.userService.getUserProfile(this.userId).subscribe(profile => {
          if (profile) {
            this.profileForm.patchValue({
              firstName: profile.firstName || '',
              lastName: profile.lastName || ''
            });
            this.updateUserDisplayInfo(profile);
          }
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.showToast('Error al cargar los datos del usuario', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private updateUserDisplayInfo(profile: UserProfile) {
    const firstName = profile.firstName || '';
    const lastName = profile.lastName || '';
    
    this.userFullName = `${firstName} ${lastName}`.trim() || 'Usuario';
    this.userInitials = this.generateInitials(firstName, lastName);
  }

  private generateInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}` || this.userEmail.charAt(0).toUpperCase();
  }

  async saveProfile() {
    if (this.profileForm.invalid) {
      this.showToast('Por favor completa todos los campos correctamente', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ 
      message: 'Guardando perfil...',
      spinner: 'crescent'
    });
    await loading.present();

    const profile: UserProfile = {
      uid: this.userId,
      email: this.userEmail,
      firstName: this.profileForm.value.firstName.trim(),
      lastName: this.profileForm.value.lastName.trim()
    };

    try {
      await this.userService.updateUserProfile(profile);
      this.updateUserDisplayInfo(profile);
      this.showToast('Perfil actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      this.showToast('Error al guardar el perfil', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async resetForm() {
    this.profileForm.reset();
    // Recargar datos originales
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.subscription = this.userService.getUserProfile(user.uid).subscribe(profile => {
        if (profile) {
          this.profileForm.patchValue({
            firstName: profile.firstName || '',
            lastName: profile.lastName || ''
          });
        }
      });
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    toast.present();
  }

  // Getters para validación en el template
  get firstName() { return this.profileForm.get('firstName'); }
  get lastName() { return this.profileForm.get('lastName'); }
}