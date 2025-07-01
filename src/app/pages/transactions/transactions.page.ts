import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, LoadingController, ToastController, ModalController } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MovementsService, Movement } from '../../services/movements.service';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { map } from 'rxjs/operators';
import { Timestamp } from '@firebase/firestore';
import { EditTransactionComponent } from 'src/app/components/edit-transaction/edit-transaction.component';
import { EditPendingPaymentComponent } from 'src/app/components/edit-pending-payment/edit-pending-payment.component';


@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule]
})
export class TransactionsPage {
  movements$!: Observable<Movement[]>;
  filteredMovements$!: Observable<Movement[]>;
  userId: string = '';
  addForm: FormGroup;
  filterForm: FormGroup;
  private filterSubject = new BehaviorSubject<{ type: string; category: string; date: string }>({
    type: '',
    category: '',
    date: ''
  });

  constructor(
    private movementsService: MovementsService,
    private authService: AuthService,
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) {
    this.addForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required],
      category: ['', Validators.required],
      type: ['expense', Validators.required],
      date: [new Date().toISOString(), Validators.required]
    });

    this.filterForm = this.fb.group({
      type: [''],
      category: [''],
      date: ['']
    });

    this.initUser();

    this.filterForm.valueChanges.subscribe(value => {
      this.filterSubject.next(value);
    });
  }

  async initUser() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.userId = user.uid;

      this.movements$ = this.movementsService.getMovements(this.userId).pipe(
        map(movements =>
          movements
            .filter(mov => mov.type === 'income' || mov.type === 'expense') // Solo ingresos y gastos
            .map(mov => ({
              ...mov,
              date: mov.date instanceof Timestamp ? mov.date.toDate() : mov.date
            }))
        )
      );

      this.filteredMovements$ = combineLatest([this.movements$, this.filterSubject]).pipe(
        map(([movements, filter]) => {
          return movements.filter(mov => {
            const matchType = filter.type ? mov.type === filter.type : true;
            const matchCategory = filter.category ? mov.category === filter.category : true;
            const matchDate = filter.date
              ? new Date(mov.date).toDateString() === new Date(filter.date).toDateString()
              : true;
            return matchType && matchCategory && matchDate;
          });
        })
      );
    }
  }

  async addMovement() {
    if (this.addForm.invalid) return;

    const loading = await this.loadingCtrl.create({ message: 'Guardando...' });
    await loading.present();

    const formValue = this.addForm.value;
    const movement: Movement = {
      amount: parseFloat(formValue.amount),
      description: formValue.description,
      category: formValue.category,
      type: formValue.type,
      date: new Date(formValue.date),
      userId: this.userId
    };

    this.movementsService.addMovement(movement).then(() => {
      loading.dismiss();
      this.addForm.reset({ type: 'expense', date: new Date().toISOString() });
      this.showToast('Movimiento agregado');
    }).catch(err => {
      loading.dismiss();
      this.showToast('Error al guardar movimiento');
      console.error(err);
    });
  }

  async deleteMovement(id: string | undefined) {
    if (!id) return;
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro que quieres eliminar este movimiento?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.movementsService.deleteMovement(id);
              this.showToast('Movimiento eliminado');
            } catch (error) {
              this.showToast('Error al eliminar movimiento');
              console.error(error);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async editMovement(mov: Movement) {
    const modal = await this.modalCtrl.create({
      component: EditTransactionComponent,
      componentProps: { movement: mov },
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data) {
      const updatedMovement: Movement = { ...mov, ...data };
      this.movementsService.updateMovement(updatedMovement);
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
