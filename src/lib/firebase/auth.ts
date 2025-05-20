// src/lib/firebase/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
  type User,
} from 'firebase/auth';
import { auth } from './config';

interface AuthResponse {
  user?: User;
  error?: string;
}

const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email address is already in use.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled.';
    case 'auth/weak-password':
      return 'The password is too weak. Please choose a stronger password.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No user found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/requires-recent-login':
      return 'This operation is sensitive and requires recent authentication. Please log in again before retrying this request.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

export const signUp = async (email: string, password: string):Promise<AuthResponse> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error: any) {
    return { error: getErrorMessage(error.code) };
  }
};

export const logIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error: any) {
    return { error: getErrorMessage(error.code) };
  }
};

export const logOut = async (): Promise<{ error?: string }> => {
  try {
    await firebaseSignOut(auth);
    return {};
  } catch (error: any) {
    return { error: getErrorMessage(error.code) };
  }
};

export const changePassword = async (newPassword: string): Promise<{ error?: string }> => {
  const user = auth.currentUser;
  if (user) {
    try {
      await firebaseUpdatePassword(user, newPassword);
      return {};
    } catch (error: any) {
      return { error: getErrorMessage(error.code) };
    }
  }
  return { error: 'No user is currently signed in.' };
};
