import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { FirebaseUser } from '../types/firebase';

// Convert Firebase User to our FirebaseUser type
const convertUser = (user: User): FirebaseUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName
});

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, displayName?: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name if provided
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return convertUser(userCredential.user);
  } catch (error: any) {
    throw new Error(`Sign up failed: ${error.message}`);
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return convertUser(userCredential.user);
  } catch (error: any) {
    throw new Error(`Sign in failed: ${error.message}`);
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return convertUser(userCredential.user);
  } catch (error: any) {
    throw new Error(`Google sign in failed: ${error.message}`);
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(`Password reset failed: ${error.message}`);
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user ? convertUser(user) : null);
  });
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  const user = auth.currentUser;
  return user ? convertUser(user) : null;
};
