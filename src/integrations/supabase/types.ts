export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          image_url: string | null
          title: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          title: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string
        }
        Relationships: []
      }
      legacy_song_overrides: {
        Row: {
          created_at: string
          hidden: boolean
          song_id: string
          start_sec: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          hidden?: boolean
          song_id: string
          start_sec?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          hidden?: boolean
          song_id?: string
          start_sec?: number
          updated_at?: string
        }
        Relationships: []
      }
      lyric_snippets: {
        Row: {
          active: boolean
          artist: string
          created_at: string
          created_by: string | null
          difficulty: string
          id: string
          lines: string[]
          title: string
          track_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          artist: string
          created_at?: string
          created_by?: string | null
          difficulty?: string
          id?: string
          lines: string[]
          title: string
          track_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          artist?: string
          created_at?: string
          created_by?: string | null
          difficulty?: string
          id?: string
          lines?: string[]
          title?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      presence_pings: {
        Row: {
          current_view: string
          last_seen: string
          nick: string
          player_id: string
        }
        Insert: {
          current_view?: string
          last_seen?: string
          nick: string
          player_id: string
        }
        Update: {
          current_view?: string
          last_seen?: string
          nick?: string
          player_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nick: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          nick: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nick?: string
          updated_at?: string
        }
        Relationships: []
      }
      track_suggestions: {
        Row: {
          artist: string
          created_at: string
          id: string
          link: string | null
          title: string
        }
        Insert: {
          artist: string
          created_at?: string
          id?: string
          link?: string | null
          title: string
        }
        Update: {
          artist?: string
          created_at?: string
          id?: string
          link?: string | null
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          enabled_album_ids: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          enabled_album_ids?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          enabled_album_ids?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          daily: Json
          endless: Json
          lyrics: Json
          updated_at: string
          user_id: string
          versus: Json
        }
        Insert: {
          daily?: Json
          endless?: Json
          lyrics?: Json
          updated_at?: string
          user_id: string
          versus?: Json
        }
        Update: {
          daily?: Json
          endless?: Json
          lyrics?: Json
          updated_at?: string
          user_id?: string
          versus?: Json
        }
        Relationships: []
      }
      versus_matches: {
        Row: {
          created_at: string
          current_round: number
          guest_nick: string | null
          guest_player_id: string | null
          guest_score: number
          host_nick: string
          host_player_id: string
          host_score: number
          id: string
          mode: string
          rematch_match_id: string | null
          rematch_requested_by: string | null
          status: string
          track_ids: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_round?: number
          guest_nick?: string | null
          guest_player_id?: string | null
          guest_score?: number
          host_nick: string
          host_player_id: string
          host_score?: number
          id?: string
          mode?: string
          rematch_match_id?: string | null
          rematch_requested_by?: string | null
          status?: string
          track_ids?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_round?: number
          guest_nick?: string | null
          guest_player_id?: string | null
          guest_score?: number
          host_nick?: string
          host_player_id?: string
          host_score?: number
          id?: string
          mode?: string
          rematch_match_id?: string | null
          rematch_requested_by?: string | null
          status?: string
          track_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      versus_round_results: {
        Row: {
          attempts_used: number
          correct: boolean
          finished_at: string
          id: string
          match_id: string
          player_id: string
          round_idx: number
        }
        Insert: {
          attempts_used: number
          correct: boolean
          finished_at?: string
          id?: string
          match_id: string
          player_id: string
          round_idx: number
        }
        Update: {
          attempts_used?: number
          correct?: boolean
          finished_at?: string
          id?: string
          match_id?: string
          player_id?: string
          round_idx?: number
        }
        Relationships: [
          {
            foreignKeyName: "versus_round_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "versus_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      yt_album_tracks: {
        Row: {
          album_id: string
          artist: string
          created_at: string
          id: string
          position: number
          start_sec: number
          title: string
          video_id: string
        }
        Insert: {
          album_id: string
          artist: string
          created_at?: string
          id?: string
          position?: number
          start_sec?: number
          title: string
          video_id: string
        }
        Update: {
          album_id?: string
          artist?: string
          created_at?: string
          id?: string
          position?: number
          start_sec?: number
          title?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yt_album_tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "yt_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      yt_albums: {
        Row: {
          artist: string
          cover_url: string
          created_at: string
          id: string
          recommended: boolean
          title: string
          year: number | null
        }
        Insert: {
          artist: string
          cover_url: string
          created_at?: string
          id?: string
          recommended?: boolean
          title: string
          year?: number | null
        }
        Update: {
          artist?: string
          cover_url?: string
          created_at?: string
          id?: string
          recommended?: boolean
          title?: string
          year?: number | null
        }
        Relationships: []
      }
      yt_tracks: {
        Row: {
          artist: string
          created_at: string
          id: string
          title: string
          video_id: string
        }
        Insert: {
          artist: string
          created_at?: string
          id?: string
          title: string
          video_id: string
        }
        Update: {
          artist?: string
          created_at?: string
          id?: string
          title?: string
          video_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
