import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService, UserProfile } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule]
})
export class ProfilePage implements OnInit {
  profileForm: FormGroup;
  userEmail: string = '';
  userId: string = '';
  private subscription?: Subscription;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required]
    });
  }

  async ngOnInit() {
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
        }
      });
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  async saveProfile() {
    if (this.profileForm.invalid) {
      this.showToast('Por favor completa todos los campos');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
    await loading.present();

    const profile: UserProfile = {
      uid: this.userId,
      email: this.userEmail,
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName
    };

    try {
      await this.userService.updateUserProfile(profile);
      this.showToast('Perfil guardado correctamente');
    } catch (error) {
      console.error(error);
      this.showToast('Error al guardar perfil');
    } finally {
      loading.dismiss();
    }
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}
