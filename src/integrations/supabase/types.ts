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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_color: string
          badge_icon: string
          category: string
          created_at: string | null
          description: string
          id: string
          name: string
          points: number | null
          rarity: string | null
          requirement_type: string | null
          requirement_value: number | null
        }
        Insert: {
          badge_color: string
          badge_icon: string
          category: string
          created_at?: string | null
          description: string
          id?: string
          name: string
          points?: number | null
          rarity?: string | null
          requirement_type?: string | null
          requirement_value?: number | null
        }
        Update: {
          badge_color?: string
          badge_icon?: string
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          points?: number | null
          rarity?: string | null
          requirement_type?: string | null
          requirement_value?: number | null
        }
        Relationships: []
      }
      checkin_photos: {
        Row: {
          checkin_week: number
          created_at: string | null
          id: string
          media_id: string | null
          notes: string | null
          photo_type: string | null
          user_id: string
        }
        Insert: {
          checkin_week: number
          created_at?: string | null
          id?: string
          media_id?: string | null
          notes?: string | null
          photo_type?: string | null
          user_id: string
        }
        Update: {
          checkin_week?: number
          created_at?: string | null
          id?: string
          media_id?: string | null
          notes?: string | null
          photo_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_photos_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_videos: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          media_id: string | null
          program_id: string
          title: string
          week_number: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          media_id?: string | null
          program_id: string
          title: string
          week_number: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          media_id?: string | null
          program_id?: string
          title?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "coach_videos_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          likes_count: number | null
          media_id: string | null
          post_type: string | null
          program_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          media_id?: string | null
          post_type?: string | null
          program_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          media_id?: string | null
          post_type?: string | null
          program_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_media: {
        Row: {
          created_at: string | null
          display_order: number | null
          exercise_id: string
          id: string
          media_id: string | null
          media_type: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          exercise_id: string
          id?: string
          media_id?: string | null
          media_type: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          exercise_id?: string
          id?: string
          media_id?: string | null
          media_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string
          created_at: string | null
          display_order: number | null
          distance: string | null
          id: string
          name: string
          notes: string | null
          reps: string | null
          rpe: number | null
          sets: number | null
          time: string | null
          video_url: string | null
          weight: number | null
          workout_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          display_order?: number | null
          distance?: string | null
          id: string
          name: string
          notes?: string | null
          reps?: string | null
          rpe?: number | null
          sets?: number | null
          time?: string | null
          video_url?: string | null
          weight?: number | null
          workout_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          display_order?: number | null
          distance?: string | null
          id?: string
          name?: string
          notes?: string | null
          reps?: string | null
          rpe?: number | null
          sets?: number | null
          time?: string | null
          video_url?: string | null
          weight?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          bucket_name: string
          created_at: string | null
          duration: number | null
          file_name: string
          file_path: string
          file_size: number | null
          height: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          bucket_name: string
          created_at?: string | null
          duration?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          bucket_name?: string
          created_at?: string | null
          duration?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          coach_id: string | null
          created_at: string | null
          display_name: string | null
          id: string
          rejection_reason: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          rejection_reason?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          rejection_reason?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_members"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      program_media: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          media_id: string | null
          media_type: string
          program_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          media_id?: string | null
          media_type: string
          program_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          media_id?: string | null
          media_type?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          icon?: string
          id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string | null
          id: string
          is_unlocked: boolean | null
          progress: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string | null
          id?: string
          is_unlocked?: boolean | null
          progress?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string | null
          id?: string
          is_unlocked?: boolean | null
          progress?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_program_progress: {
        Row: {
          completed: boolean | null
          created_at: string | null
          current_week_number: number
          id: string
          program_id: string
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          current_week_number?: number
          id?: string
          program_id: string
          start_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          current_week_number?: number
          id?: string
          program_id?: string
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_workout_date: string | null
          longest_streak: number | null
          total_prs: number | null
          total_volume_kg: number | null
          total_workouts: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_workout_date?: string | null
          longest_streak?: number | null
          total_prs?: number | null
          total_volume_kg?: number | null
          total_workouts?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_workout_date?: string | null
          longest_streak?: number | null
          total_prs?: number | null
          total_volume_kg?: number | null
          total_workouts?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weeks: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          phase_name: string | null
          program_id: string
          week_number: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id: string
          name: string
          phase_name?: string | null
          program_id: string
          week_number: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          phase_name?: string | null
          program_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "weeks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          day_number: number
          display_order: number | null
          duration: number
          id: string
          name: string
          week_id: string
        }
        Insert: {
          created_at?: string | null
          day_number: number
          display_order?: number | null
          duration?: number
          id: string
          name: string
          week_id: string
        }
        Update: {
          created_at?: string | null
          day_number?: number
          display_order?: number | null
          duration?: number
          id?: string
          name?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      coach_members: {
        Row: {
          coach_id: string | null
          coach_name: string | null
          member_avatar: string | null
          member_id: string | null
          member_name: string | null
          member_role: Database["public"]["Enums"]["app_role"] | null
          member_user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_members"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_coach_of_member: {
        Args: { _coach_id: string; _member_id: string }
        Returns: boolean
      }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "coach" | "member"
      approval_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "coach", "member"],
      approval_status: ["pending", "approved", "rejected"],
    },
  },
} as const
