import { Component, Input } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-edit-transaction',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './edit-transaction.component.html',
})
export class EditTransactionComponent {
  @Input() movement: any;

  form!: FormGroup;

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      amount: [this.movement.amount, [Validators.required]],
      description: [this.movement.description, [Validators.required]],
      category: [this.movement.category, [Validators.required]],
      type: [this.movement.type, [Validators.required]],
      date: [this.movement.date, [Validators.required]],
    });
  }

  close() {
    this.modalCtrl.dismiss();
  }

  save() {
    if (this.form.valid) {
      this.modalCtrl.dismiss(this.form.value);
    }
  }
}
