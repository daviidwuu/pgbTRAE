/**
 * Authentication Service
 * 
 * Handles core authentication operations with Firebase.
 * Single responsibility: Authentication state management.
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { BaseService } from '../../services';
import { AuthUser, LoginCredentials, RegisterData } from '../types/auth.types';
import { AUTH_ERRORS } from '../constants/auth.constants';

export class AuthService extends BaseService {
  private auth: Auth;

  constructor(auth: Auth) {
    super();
    this.auth = auth;
  }

  /**
   * Convert Firebase User to AuthUser
   */
  private mapFirebaseUser(firebaseUser: FirebaseUser): AuthUser {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
    };
  }

  /**
   * Sign in with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );
      
      return this.mapFirebaseUser(userCredential.user);
    } catch (error: any) {
      throw new Error(this.mapAuthError(error.code));
    }
  }

  /**
   * Create new user account
   */
  async register(data: RegisterData): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        data.email,
        data.password
      );
      
      return this.mapFirebaseUser(userCredential.user);
    } catch (error: any) {
      throw new Error(this.mapAuthError(error.code));
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw new Error(this.mapAuthError(error.code));
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    const firebaseUser = this.auth.currentUser;
    return firebaseUser ? this.mapFirebaseUser(firebaseUser) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  /**
   * Map Firebase auth errors to user-friendly messages
   */
  private mapAuthError(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return AUTH_ERRORS.INVALID_CREDENTIALS;
      case 'auth/email-already-in-use':
        return AUTH_ERRORS.EMAIL_ALREADY_IN_USE;
      case 'auth/weak-password':
        return AUTH_ERRORS.WEAK_PASSWORD;
      case 'auth/network-request-failed':
        return AUTH_ERRORS.NETWORK_ERROR;
      case 'auth/too-many-requests':
        return AUTH_ERRORS.ACCOUNT_LOCKED;
      default:
        return 'An authentication error occurred';
    }
  }

  /**
   * Add authentication state listener
   */
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return this.auth.onAuthStateChanged((firebaseUser) => {
      const authUser = firebaseUser ? this.mapFirebaseUser(firebaseUser) : null;
      callback(authUser);
    });
  }
}