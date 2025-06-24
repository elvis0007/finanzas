import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, user, User } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null>;

  constructor(private auth: Auth) {
    this.user$ = user(this.auth);
  }

  login(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(this.auth, email, password).then(() => {});
  }

  register(email: string, password: string): Promise<void> {
    return createUserWithEmailAndPassword(this.auth, email, password).then(() => {});
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  getCurrentUser(): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const unsubscribe = this.auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      }, reject);
    });
  }
}
