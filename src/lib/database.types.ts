export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'member' | 'viewer'
export type BorrowStatus = 'borrowed' | 'returned' | 'overdue'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: UserRole
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: UserRole
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: UserRole
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      book_shelves: {
        Row: {
          id: string
          name: string
          location: string
          description: string | null
          capacity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          description?: string | null
          capacity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          description?: string | null
          capacity?: number
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          uid: string
          name: string
          author: string
          description: string | null
          categories: string[]
          shelf_id: string | null
          total_copies: number
          available_copies: number
          cover_image: string | null
          isbn: string | null
          publisher: string | null
          published_year: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          uid: string
          name: string
          author: string
          description?: string | null
          categories?: string[]
          shelf_id?: string | null
          total_copies?: number
          available_copies?: number
          cover_image?: string | null
          isbn?: string | null
          publisher?: string | null
          published_year?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          uid?: string
          name?: string
          author?: string
          description?: string | null
          categories?: string[]
          shelf_id?: string | null
          total_copies?: number
          available_copies?: number
          cover_image?: string | null
          isbn?: string | null
          publisher?: string | null
          published_year?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      borrow_records: {
        Row: {
          id: string
          book_id: string
          member_id: string
          borrowed_at: string
          due_date: string
          returned_at: string | null
          status: BorrowStatus
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          book_id: string
          member_id: string
          borrowed_at?: string
          due_date: string
          returned_at?: string | null
          status?: BorrowStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          member_id?: string
          borrowed_at?: string
          due_date?: string
          returned_at?: string | null
          status?: BorrowStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      fines: {
        Row: {
          id: string
          borrow_record_id: string
          member_id: string
          amount: number
          paid: boolean
          paid_at: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          borrow_record_id: string
          member_id: string
          amount: number
          paid?: boolean
          paid_at?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          borrow_record_id?: string
          member_id?: string
          amount?: number
          paid?: boolean
          paid_at?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      borrow_status: BorrowStatus
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type BookShelf = Database['public']['Tables']['book_shelves']['Row']
export type BookShelfInsert = Database['public']['Tables']['book_shelves']['Insert']
export type BookShelfUpdate = Database['public']['Tables']['book_shelves']['Update']

export type Book = Database['public']['Tables']['books']['Row']
export type BookInsert = Database['public']['Tables']['books']['Insert']
export type BookUpdate = Database['public']['Tables']['books']['Update']

export type BorrowRecord = Database['public']['Tables']['borrow_records']['Row']
export type BorrowRecordInsert = Database['public']['Tables']['borrow_records']['Insert']
export type BorrowRecordUpdate = Database['public']['Tables']['borrow_records']['Update']

export type Fine = Database['public']['Tables']['fines']['Row']
export type FineInsert = Database['public']['Tables']['fines']['Insert']
export type FineUpdate = Database['public']['Tables']['fines']['Update']

// Extended types with relations
export interface BookWithShelf extends Book {
  book_shelves: BookShelf | null
}

export interface BorrowRecordWithDetails extends BorrowRecord {
  books: Book
  users: User
  fines?: Fine[]
}

export interface UserWithBorrowHistory extends User {
  borrow_records: BorrowRecordWithDetails[]
  fines: Fine[]
}
