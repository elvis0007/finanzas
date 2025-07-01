import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Movement } from 'src/app/services/movements.service';

@Component({
  selector: 'app-edit-pending-payment',
  templateUrl: './edit-pending-payment.component.html',
  styleUrls: ['./edit-pending-payment.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class EditPendingPaymentComponent {
  @Input() movement!: Movement;
  form: FormGroup;

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required],
      category: ['', Validators.required],
      dueDate: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.movement) {
      this.form.patchValue({
        amount: this.movement.amount,
        description: this.movement.description,
        category: this.movement.category,
        dueDate: this.convertToISOString(this.movement.dueDate),
      });
    }
  }

  convertToISOString(date: any): string {
    if (!date) return '';
    if (date instanceof Date) return date.toISOString();
    if (typeof date.toDate === 'function') return date.toDate().toISOString();
    return new Date(date).toISOString();
  }


  cancel() {
    this.modalCtrl.dismiss();
  }

  save() {
    if (this.form.valid) {
      this.modalCtrl.dismiss(this.form.value);
    }
  }
}
