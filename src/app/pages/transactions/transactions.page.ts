// src/app/pages/transactions/transactions.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subscription, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MovementsService } from '../../services/movements.service';
import { AuthService } from '../../services/auth.service';

export interface Movement {
  id?: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: Date;
  userId: string;
}

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class TransactionsPage implements OnInit, OnDestroy {
  addForm!: FormGroup;
  filterForm!: FormGroup;
  
  private movementsSubject = new BehaviorSubject<Movement[]>([]);
  private filterSubject = new BehaviorSubject<{type: string, category: string}>({type: '', category: ''});
  
  movements$ = this.movementsSubject.asObservable();
  filteredMovements$!: Observable<Movement[]>;
  
  private subscription?: Subscription;
  private currentUserId?: string;

  // Mapeo de categorías
  private categoryMap: { [key: string]: string } = {
    'comida': '🍔 Comida',
    'transporte': '🚗 Transporte',
    'salud': '🩺 Salud',
    'educacion': '📚 Educación',
    'entretenimiento': '🎮 Entretenimiento',
    'compras': '🛒 Compras',
    'otros': '📦 Otros'
  };

  constructor(
    private fb: FormBuilder,
    private movementsService: MovementsService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.initializeForms();
    this.setupFilteredMovements();
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.setupFilterSubscription();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private initializeForms() {
    // Formulario para agregar movimientos
    this.addForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      type: ['expense', Validators.required],
      date: [new Date().toISOString(), Validators.required]
    });

    // Formulario para filtros
    this.filterForm = this.fb.group({
      type: [''],
      category: ['']
    });
  }

  private setupFilteredMovements() {
    this.filteredMovements$ = combineLatest([
      this.movements$,
      this.filterSubject.asObservable()
    ]).pipe(
      map(([movements, filters]) => {
        return movements.filter(movement => {
          const typeMatch = !filters.type || movement.type === filters.type;
          const categoryMatch = !filters.category || movement.category === filters.category;
          return typeMatch && categoryMatch;
        });
      })
    );
  }

  private async loadCurrentUser() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        this.currentUserId = user.uid;
        this.loadMovements();
      }
    } catch (error) {
      console.error('Error loading user:', error);
      this.showToast('Error al cargar usuario', 'danger');
    }
  }

  private loadMovements() {
    if (!this.currentUserId) return;

    this.subscription = this.movementsService.getMovements(this.currentUserId)
      .subscribe({
        next: (movements) => {
          // Ordenar por fecha (más recientes primero)
          const sortedMovements = movements.sort((a, b) => {
            const dateA = this.parseDate(a.date);
            const dateB = this.parseDate(b.date);
            return dateB.getTime() - dateA.getTime();
          });
          this.movementsSubject.next(sortedMovements);
        },
        error: (error) => {
          console.error('Error loading movements:', error);
          this.showToast('Error al cargar movimientos', 'danger');
        }
      });
  }

  private setupFilterSubscription() {
    this.filterForm.valueChanges.subscribe(filters => {
      this.filterSubject.next(filters);
    });
  }

  private parseDate(date: any): Date {
    if (date instanceof Date) return date;
    if (date?.toDate) return date.toDate();
    if (date?.seconds) return new Date(date.seconds * 1000);
    return new Date(date);
  }

  async addMovement() {
    if (this.addForm.valid && this.currentUserId) {
      try {
        const formValue = this.addForm.value;
        const movement: Movement = {
          amount: parseFloat(formValue.amount),
          description: formValue.description.trim(),
          category: formValue.category,
          type: formValue.type,
          date: new Date(formValue.date),
          userId: this.currentUserId
        };

        await this.movementsService.addMovement(movement);
        this.addForm.reset({
          type: 'expense',
          date: new Date().toISOString()
        });
        
        await this.showToast('Movimiento agregado exitosamente', 'success');
      } catch (error) {
        console.error('Error adding movement:', error);
        await this.showToast('Error al agregar movimiento', 'danger');
      }
    } else {
      await this.showToast('Por favor completa todos los campos correctamente', 'warning');
    }
  }

  async editMovement(movement: Movement) {
    const alert = await this.alertController.create({
      header: 'Editar Movimiento',
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Monto',
          value: movement.amount.toString()
        },
        {
          name: 'description',
          type: 'text',
          placeholder: 'Descripción',
          value: movement.description
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (data.amount && data.description && movement.id) {
              try {
                const updatedMovement: Movement = {
                  ...movement,
                  amount: parseFloat(data.amount),
                  description: data.description.trim()
                };

                await this.movementsService.updateMovement(updatedMovement);
                await this.showToast('Movimiento actualizado', 'success');
              } catch (error) {
                console.error('Error updating movement:', error);
                await this.showToast('Error al actualizar movimiento', 'danger');
              }
            } else {
              await this.showToast('Datos inválidos', 'warning');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteMovement(movementId?: string) {
    if (!movementId) return;

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que quieres eliminar este movimiento?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.movementsService.deleteMovement(movementId);
              await this.showToast('Movimiento eliminado', 'success');
            } catch (error) {
              console.error('Error deleting movement:', error);
              await this.showToast('Error al eliminar movimiento', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getCategoryName(category: string): string {
    return this.categoryMap[category] || category;
  }

  trackByMovement(index: number, movement: Movement): any {
    return movement.id || index;
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      buttons: [
        {
          text: 'X',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  // Métodos auxiliares para validación de formularios
  get amountError(): boolean {
    const control = this.addForm.get('amount');
    return !!(control?.touched && control?.invalid);
  }

  get descriptionError(): boolean {
    const control = this.addForm.get('description');
    return !!(control?.touched && control?.invalid);
  }

  get categoryError(): boolean {
    const control = this.addForm.get('category');
    return !!(control?.touched && control?.invalid);
  }

  // Método para limpiar filtros
  clearFilters() {
    this.filterForm.reset();
  }

  // Método para refrescar datos
  async refreshData(event?: any) {
    this.loadMovements();
    if (event) {
      setTimeout(() => {
        event.target.complete();
      }, 1000);
    }
  }
}