import { Injectable } from '@angular/core';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface UserProfile {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private firestore: Firestore) {}

  getUserProfile(uid: string): Observable<UserProfile> {
    const userDoc = doc(this.firestore, `users/${uid}`);
    return docData(userDoc) as Observable<UserProfile>;
  }

  async updateUserProfile(profile: UserProfile) {
    const userDoc = doc(this.firestore, `users/${profile.uid}`);
    return setDoc(userDoc, profile, { merge: true });
  }
}
