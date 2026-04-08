// Tento soubor je generován příkazem:
// supabase gen types typescript --project-id <project-id> > types/supabase.ts
// Níže je ruční definice pro lokální vývoj bez připojeného Supabase projektu.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nickname: string
          avatar_url: string | null
          elo_rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nickname: string
          avatar_url?: string | null
          elo_rating?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nickname?: string
          avatar_url?: string | null
          elo_rating?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          bio: string | null
          country: string | null
          preferred_language: string | null
        }
        Insert: {
          id?: string
          user_id: string
          bio?: string | null
          country?: string | null
          preferred_language?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          bio?: string | null
          country?: string | null
          preferred_language?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      statistics: {
        Row: {
          id: string
          user_id: string
          games_played: number
          games_won: number
          games_lost: number
          total_score: number
          average_score: number
          longest_word: string | null
          longest_word_score: number
          highest_single_turn_score: number
          current_win_streak: number
          best_win_streak: number
        }
        Insert: {
          id?: string
          user_id: string
          games_played?: number
          games_won?: number
          games_lost?: number
          total_score?: number
          average_score?: number
          longest_word?: string | null
          longest_word_score?: number
          highest_single_turn_score?: number
          current_win_streak?: number
          best_win_streak?: number
        }
        Update: {
          id?: string
          user_id?: string
          games_played?: number
          games_won?: number
          games_lost?: number
          total_score?: number
          average_score?: number
          longest_word?: string | null
          longest_word_score?: number
          highest_single_turn_score?: number
          current_win_streak?: number
          best_win_streak?: number
        }
        Relationships: [
          {
            foreignKeyName: "statistics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      elo_history: {
        Row: {
          id: string
          user_id: string
          elo_change: number
          elo_before: number
          elo_after: number
          game_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          elo_change: number
          elo_before: number
          elo_after: number
          game_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          elo_change?: number
          elo_before?: number
          elo_after?: number
          game_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "elo_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elo_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          }
        ]
      }
      games: {
        Row: {
          id: string
          type: 'CUSTOM' | 'RANKED'
          status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED'
          name: string | null
          is_private: boolean
          password_hash: string | null
          board_state: Json
          tile_bag: Json
          current_player_index: number
          turn_number: number
          max_players: number
          turn_time_limit: number | null
          winner_id: string | null
          created_by_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'CUSTOM' | 'RANKED'
          status?: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED'
          name?: string | null
          is_private?: boolean
          password_hash?: string | null
          board_state?: Json
          tile_bag?: Json
          current_player_index?: number
          turn_number?: number
          max_players?: number
          turn_time_limit?: number | null
          winner_id?: string | null
          created_by_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'CUSTOM' | 'RANKED'
          status?: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED'
          name?: string | null
          is_private?: boolean
          password_hash?: string | null
          board_state?: Json
          tile_bag?: Json
          current_player_index?: number
          turn_number?: number
          max_players?: number
          turn_time_limit?: number | null
          winner_id?: string | null
          created_by_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      game_players: {
        Row: {
          id: string
          game_id: string
          user_id: string
          rack: Json
          score: number
          is_active: boolean
          has_left: boolean
          turn_order: number
          joined_at: string
        }
        Insert: {
          id?: string
          game_id: string
          user_id: string
          rack?: Json
          score?: number
          is_active?: boolean
          has_left?: boolean
          turn_order: number
          joined_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          user_id?: string
          rack?: Json
          score?: number
          is_active?: boolean
          has_left?: boolean
          turn_order?: number
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      game_moves: {
        Row: {
          id: string
          game_id: string
          user_id: string
          move_type: 'PLACE' | 'EXCHANGE' | 'PASS' | 'RESIGN'
          tiles: Json
          words: Json
          score: number
          rack_after: Json
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          user_id: string
          move_type: 'PLACE' | 'EXCHANGE' | 'PASS' | 'RESIGN'
          tiles?: Json
          words?: Json
          score?: number
          rack_after: Json
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          user_id?: string
          move_type?: 'PLACE' | 'EXCHANGE' | 'PASS' | 'RESIGN'
          tiles?: Json
          words?: Json
          score?: number
          rack_after?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_moves_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_moves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      game_invites: {
        Row: {
          id: string
          game_id: string
          from_user_id: string
          to_user_id: string
          status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          from_user_id: string
          to_user_id: string
          status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          from_user_id?: string
          to_user_id?: string
          status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
          expires_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_invites_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_invites_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_invites_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ranked_queue: {
        Row: {
          id: string
          user_id: string
          elo_rating: number
          status: 'WAITING' | 'MATCHED' | 'CANCELLED'
          search_range_min: number
          search_range_max: number
          joined_at: string
          matched_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          elo_rating: number
          status?: 'WAITING' | 'MATCHED' | 'CANCELLED'
          search_range_min: number
          search_range_max: number
          joined_at?: string
          matched_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          elo_rating?: number
          status?: 'WAITING' | 'MATCHED' | 'CANCELLED'
          search_range_min?: number
          search_range_max?: number
          joined_at?: string
          matched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ranked_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          game_id: string | null
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          game_id?: string | null
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string | null
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      direct_message_threads: {
        Row: {
          id: string
          participant1_id: string
          participant2_id: string
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          participant1_id: string
          participant2_id: string
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          participant1_id?: string
          participant2_id?: string
          last_message_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_message_threads_participant1_id_fkey"
            columns: ["participant1_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_message_threads_participant2_id_fkey"
            columns: ["participant2_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      direct_messages: {
        Row: {
          id: string
          thread_id: string
          sender_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          sender_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          sender_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "direct_message_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      dictionary_words: {
        Row: {
          id: string
          word: string
          length: number
          is_valid: boolean
        }
        Insert: {
          id?: string
          word: string
          is_valid?: boolean
        }
        Update: {
          id?: string
          word?: string
          is_valid?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'GAME_INVITE' | 'GAME_START' | 'GAME_END' | 'DM' | 'SYSTEM'
          title: string
          body: string
          is_read: boolean
          related_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'GAME_INVITE' | 'GAME_START' | 'GAME_END' | 'DM' | 'SYSTEM'
          title: string
          body: string
          is_read?: boolean
          related_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'GAME_INVITE' | 'GAME_START' | 'GAME_END' | 'DM' | 'SYSTEM'
          title?: string
          body?: string
          is_read?: boolean
          related_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
