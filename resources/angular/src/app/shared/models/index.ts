// src/app/core/models/index.ts

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user?: User;
}

export interface Account {
  id: string;
  name: string;
  type: 'asset' | 'expense' | 'revenue' | 'liability' | 'equity';
  currency_code: string;
  current_balance: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: 'withdrawal' | 'deposit' | 'transfer' | 'opening_balance';
  date: string;
  description: string;
  amount: number;
  source_id?: string;
  destination_id?: string;
}

export interface Budget {
  id: string;
  name: string;
  currency_code: string;
  period: string;
  amount: number;
  spent: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'revenue';
  spent?: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
