import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { MovementsService, Movement } from 'src/app/services/movements.service';
import { AuthService } from 'src/app/services/auth.service';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Timestamp } from '@firebase/firestore';
import { EditPendingPaymentComponent } from 'src/app/components/edit-pending-payment/edit-pending-payment.component';
import { ModalController } from '@ionic/angular';


@Component({
  selector: 'app-pending-payments',
  templateUrl: './pending-payments.page.html',
  styleUrls: ['./pending-payments.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule],
})
export class PendingPaymentsPage implements OnInit {
  pagosPendientes$!:  Observable<Movement[]> | undefined;
  addForm: FormGroup;
  userId: string = '';

  constructor(
    private fb: FormBuilder,
    private movementsService: MovementsService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController
  ) {
    this.addForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required],
      category: ['', Validators.required],
      dueDate: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.authService.getCurrentUser().then(user => {
      if (user) {
        this.userId = user.uid;
        this.cargarPagosPendientes();
      }
    });
  }
   cargarPagosPendientes() {
    this.pagosPendientes$ = this.movementsService.getPagosPendientes(this.userId);
  }

  async addPagoPendiente() {
    if (this.addForm.invalid) return;

    const loading = await this.loadingCtrl.create({ message: 'Guardando pago...' });
    await loading.present();

    const formValue = this.addForm.value;
    const nuevoPago: Movement = {
      amount: parseFloat(formValue.amount),
      description: formValue.description,
      category: formValue.category,
      type: 'pago_pendiente',
      date: new Date(),
      dueDate: new Date(formValue.dueDate),
      userId: this.userId,
      status: 'pendiente'
    };

    this.movementsService.addMovement(nuevoPago).then(() => {
      loading.dismiss();
      this.addForm.reset();
      this.cargarPagosPendientes();
      this.showToast('Pago pendiente guardado ✅');
    }).catch(error => {
      loading.dismiss();
      this.showToast('Error al guardar pago');
      console.error(error);
    });
  }

  async marcarComoHecho(id: string) {
    const alert = await this.alertCtrl.create({
      header: '¿Confirmar?',
      message: '¿Deseas marcar este pago como hecho?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí',
          handler: async () => {
            await this.movementsService.marcarPagoComoHecho(id);
            this.cargarPagosPendientes();
            this.showToast('Pago marcado como hecho ✅');
          }
        }
      ]
    });
    await alert.present();
  }

  async eliminarPago(id: string) {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar?',
      message: '¿Seguro que deseas eliminar este pago?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            await this.movementsService.deleteMovement(id);
            this.cargarPagosPendientes();
            this.showToast('Pago eliminado 🗑️');
          }
        }
      ]
    });
    await alert.present();
  }

  async editarPago(pago: Movement) {
  const modal = await this.modalCtrl.create({
    component: EditPendingPaymentComponent,
    componentProps: { movement: pago },
  });

  await modal.present();

  const { data } = await modal.onDidDismiss();

  if (data) {
    const updatedMovement: Movement = { ...pago, ...data };
    await this.movementsService.updateMovement(updatedMovement);
    this.cargarPagosPendientes();
    const toast = await this.toastCtrl.create({
      message: 'Pago actualizado ✅',
      duration: 2000,
      color: 'success',
    });
    toast.present();
  }
}

  convertirFecha(fecha: any): Date {
    if (fecha?.toDate) return fecha.toDate(); // Firebase Timestamp
    if (fecha instanceof Date) return fecha;  // JavaScript Date
    return new Date(fecha);                   // por si viene como string
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
