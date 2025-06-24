import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, deleteDoc, updateDoc, query, where, orderBy, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Movement {
  id?: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: Date | Timestamp | any;  // Acepta Timestamp o Date u otro
  userId: string;  // para filtrar por usuario
}

@Injectable({
  providedIn: 'root'
})
export class MovementsService {
  private collectionName = 'movements';

  constructor(private firestore: Firestore) {}

  // Obtener movimientos de un usuario ordenados por fecha descendente
  getMovements(userId: string): Observable<Movement[]> {
    const movementsRef = collection(this.firestore, this.collectionName);
    const q = query(movementsRef, where('userId', '==', userId), orderBy('date', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Movement[]>;
  }

  // Agregar un nuevo movimiento
  addMovement(movement: Movement) {
    const movementsRef = collection(this.firestore, this.collectionName);
    return addDoc(movementsRef, movement);
  }

  // Eliminar un movimiento
  deleteMovement(id: string) {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);
    return deleteDoc(docRef);
  }

  // Actualizar un movimiento
  updateMovement(movement: Movement) {
    const movementDoc = doc(this.firestore, `movements/${movement.id}`);
    return updateDoc(movementDoc, { 
      amount: movement.amount,
      description: movement.description,
      category: movement.category,
      date: movement.date
    });
  }

  // Función para validar si es Timestamp
  private isTimestamp(value: any): value is Timestamp {
    return value && typeof value.toDate === 'function';
  }

  // Obtener resumen financiero
  getFinancialSummary(userId: string) {
    return this.getMovements(userId).pipe(
      map(movements => {
        const ingresos = movements
          .filter(m => m.type === 'income')
          .reduce((sum, m) => sum + m.amount, 0);

        const gastos = movements
          .filter(m => m.type === 'expense')
          .reduce((sum, m) => sum + m.amount, 0);

        const balance = ingresos - gastos;

        // Resumen mensual
        const resumenMensual = movements.reduce((acc, m) => {
          let month: number;

          if (m.date instanceof Date) {
            month = m.date.getMonth();
          } else if (this.isTimestamp(m.date)) {
            month = m.date.toDate().getMonth();
          } else {
            month = new Date(m.date).getMonth();
          }

          acc[month] = acc[month] || { ingresos: 0, gastos: 0 };
          if (m.type === 'income') acc[month].ingresos += m.amount;
          else acc[month].gastos += m.amount;
          return acc;
        }, {} as { [month: number]: { ingresos: number; gastos: number } });

        return { ingresos, gastos, balance, resumenMensual };
      })
    );
  }
}
