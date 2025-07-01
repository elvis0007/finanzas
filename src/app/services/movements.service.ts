import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Movement {
  id?: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense' | 'pago_pendiente';
  date: Date | Timestamp | any;
  status?: 'pendiente' | 'hecho';
  dueDate?: Date;
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class MovementsService {
  private collectionName = 'movements';

  constructor(private firestore: Firestore) {}

  // Obtener movimientos de un usuario ordenados por fecha descendente
  getMovements(userId: string): Observable<Movement[]> {
    const movementsRef = collection(this.firestore, this.collectionName);
    const q = query(
      movementsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Movement[]>;
  }

  // Agregar un nuevo movimiento
  addMovement(movement: Movement) {
    const movementsRef = collection(this.firestore, this.collectionName);

    // Si es un pago pendiente, asegúrate de incluir estado y dueDate
    if (movement.type === 'pago_pendiente') {
      movement.status = 'pendiente';
      movement.dueDate = movement.dueDate || movement.date;
    }

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
    const dataToUpdate: any = {
      amount: movement.amount,
      description: movement.description,
      category: movement.category,
      type: movement.type,
      date: movement.date,
    };

    // Solo si es pago pendiente, guarda estado y dueDate
    if (movement.type === 'pago_pendiente') {
      dataToUpdate.status = movement.status || 'pendiente';
      dataToUpdate.dueDate = movement.dueDate;
    }

    return updateDoc(movementDoc, dataToUpdate);
  }

  // Marcar pago pendiente como hecho y convertirlo en gasto
  async marcarPagoComoHecho(id: string) {
    const docRef = doc(this.firestore, `${this.collectionName}/${id}`);

    // Actualizamos el documento para que sea tipo 'expense' y estado 'hecho'
    await updateDoc(docRef, { 
      status: 'hecho',
      type: 'expense',
      date: new Date() // opcional: actualizar la fecha a hoy
    });
  }

  // Obtener solo pagos pendientes no marcados como hecho
  getPagosPendientes(userId: string): Observable<Movement[]> {
    const ref = collection(this.firestore, this.collectionName);
    const q = query(
      ref,
      where('userId', '==', userId),
      where('type', '==', 'pago_pendiente'),
      where('status', '==', 'pendiente'),
      orderBy('dueDate', 'asc')
    );

    return collectionData(q, { idField: 'id' }) as Observable<Movement[]>;
  }

  // Función para validar si es Timestamp
  private isTimestamp(value: any): value is Timestamp {
    return value && typeof value.toDate === 'function';
  }

  // Obtener resumen financiero
  getFinancialSummary(userId: string) {
    return this.getMovements(userId).pipe(
      map((movements) => {
        const ingresos = movements
          .filter((m) => m.type === 'income')
          .reduce((sum, m) => sum + m.amount, 0);

        const gastos = movements
          .filter((m) => m.type === 'expense')
          .reduce((sum, m) => sum + m.amount, 0);

        const balance = ingresos - gastos;

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
          else if (m.type === 'expense') acc[month].gastos += m.amount;
          return acc;
        }, {} as { [month: number]: { ingresos: number; gastos: number } });

        return { ingresos, gastos, balance, resumenMensual };
      })
    );
  }
}
