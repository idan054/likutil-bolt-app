import type { User as FirebaseUser } from 'firebase/auth';

export type User = FirebaseUser;

export interface AuthError {
  code: string;
  message: string;
}

export interface WooAuthResponse {
  consumer_key: string;
  consumer_secret: string;
  store_url: string;
  user_id: string;
  firebase_token?: string;
  email?: string;
}