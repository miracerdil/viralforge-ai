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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ab_tests: {
        Row: {
          created_at: string
          id: string
          input_json: Json
          result_json: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_json: Json
          result_json?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_json?: Json
          result_json?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generations: {
        Row: {
          category_group: string | null
          category_slug: string | null
          created_at: string | null
          feature: string
          generation_time_ms: number | null
          goal: string | null
          id: string
          model_used: string | null
          output_count: number | null
          output_preview: string | null
          persona_context: Json | null
          platform: string
          prompt_hash: string | null
          tone: string | null
          user_id: string
        }
        Insert: {
          category_group?: string | null
          category_slug?: string | null
          created_at?: string | null
          feature: string
          generation_time_ms?: number | null
          goal?: string | null
          id?: string
          model_used?: string | null
          output_count?: number | null
          output_preview?: string | null
          persona_context?: Json | null
          platform: string
          prompt_hash?: string | null
          tone?: string | null
          user_id: string
        }
        Update: {
          category_group?: string | null
          category_slug?: string | null
          created_at?: string | null
          feature?: string
          generation_time_ms?: number | null
          goal?: string | null
          id?: string
          model_used?: string | null
          output_count?: number | null
          output_preview?: string | null
          persona_context?: Json | null
          platform?: string
          prompt_hash?: string | null
          tone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analyses: {
        Row: {
          category_group: string
          category_slug: string
          created_at: string
          duration_sec: number | null
          id: string
          platform: string
          result_json: Json | null
          status: string
          transcript: string | null
          user_id: string
          video_path: string | null
        }
        Insert: {
          category_group?: string
          category_slug?: string
          created_at?: string
          duration_sec?: number | null
          id?: string
          platform?: string
          result_json?: Json | null
          status?: string
          transcript?: string | null
          user_id: string
          video_path?: string | null
        }
        Update: {
          category_group?: string
          category_slug?: string
          created_at?: string
          duration_sec?: number | null
          id?: string
          platform?: string
          result_json?: Json | null
          status?: string
          transcript?: string | null
          user_id?: string
          video_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_frames: {
        Row: {
          analysis_id: string
          created_at: string
          frame_path: string
          id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          frame_path: string
          id?: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          frame_path?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_frames_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description_en: string | null
          description_tr: string | null
          group_id: string
          icon: string | null
          id: string
          is_active: boolean
          label_en: string
          label_tr: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_tr?: string | null
          group_id: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label_en: string
          label_tr: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_tr?: string | null
          group_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label_en?: string
          label_tr?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "category_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      category_groups: {
        Row: {
          created_at: string
          id: string
          label_en: string
          label_tr: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id: string
          label_en: string
          label_tr: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label_en?: string
          label_tr?: string
          sort_order?: number
        }
        Relationships: []
      }
      content_results: {
        Row: {
          comments: number | null
          content_preview: string | null
          content_type: string
          created_at: string | null
          engagement_rate: number | null
          followers_gained: number | null
          generation_id: string | null
          id: string
          likes: number | null
          platform: string
          posted_at: string | null
          saves: number | null
          shares: number | null
          updated_at: string | null
          user_id: string
          views: number | null
        }
        Insert: {
          comments?: number | null
          content_preview?: string | null
          content_type: string
          created_at?: string | null
          engagement_rate?: number | null
          followers_gained?: number | null
          generation_id?: string | null
          id?: string
          likes?: number | null
          platform: string
          posted_at?: string | null
          saves?: number | null
          shares?: number | null
          updated_at?: string | null
          user_id: string
          views?: number | null
        }
        Update: {
          comments?: number | null
          content_preview?: string | null
          content_type?: string
          created_at?: string | null
          engagement_rate?: number | null
          followers_gained?: number | null
          generation_id?: string | null
          id?: string
          likes?: number | null
          platform?: string
          posted_at?: string | null
          saves?: number | null
          shares?: number | null
          updated_at?: string | null
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_results_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "ai_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_persona_profiles: {
        Row: {
          avg_hook_length: number
          avg_performance_score: number | null
          best_performing_format: string | null
          best_performing_opening: string | null
          best_performing_tone: string | null
          created_at: string
          cta_style: string
          format_bias: Json
          last_updated_at: string
          onboarding_answers: Json | null
          opening_bias: Json
          pacing: string
          tone_weights: Json
          total_ab_wins: number
          total_exports: number
          total_generations: number
          total_saves: number
          user_id: string
        }
        Insert: {
          avg_hook_length?: number
          avg_performance_score?: number | null
          best_performing_format?: string | null
          best_performing_opening?: string | null
          best_performing_tone?: string | null
          created_at?: string
          cta_style?: string
          format_bias?: Json
          last_updated_at?: string
          onboarding_answers?: Json | null
          opening_bias?: Json
          pacing?: string
          tone_weights?: Json
          total_ab_wins?: number
          total_exports?: number
          total_generations?: number
          total_saves?: number
          user_id: string
        }
        Update: {
          avg_hook_length?: number
          avg_performance_score?: number | null
          best_performing_format?: string | null
          best_performing_opening?: string | null
          best_performing_tone?: string | null
          created_at?: string
          cta_style?: string
          format_bias?: Json
          last_updated_at?: string
          onboarding_answers?: Json | null
          opening_bias?: Json
          pacing?: string
          tone_weights?: Json
          total_ab_wins?: number
          total_exports?: number
          total_generations?: number
          total_saves?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_persona_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_missions: {
        Row: {
          created_at: string
          difficulty: string
          id: string
          is_pro_only: boolean
          locale: string
          mission_text: string
          niche: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          difficulty?: string
          id?: string
          is_pro_only?: boolean
          locale: string
          mission_text: string
          niche: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          difficulty?: string
          id?: string
          is_pro_only?: boolean
          locale?: string
          mission_text?: string
          niche?: string
          xp_reward?: number
        }
        Relationships: []
      }
      hook_templates: {
        Row: {
          category_group: string
          category_slug: string
          created_at: string | null
          hook_text: string
          id: string
          is_generated: boolean | null
          locale: string
          niche: string
          platform: string
          tags: string[] | null
          tone: string
        }
        Insert: {
          category_group?: string
          category_slug?: string
          created_at?: string | null
          hook_text: string
          id?: string
          is_generated?: boolean | null
          locale: string
          niche: string
          platform?: string
          tags?: string[] | null
          tone: string
        }
        Update: {
          category_group?: string
          category_slug?: string
          created_at?: string | null
          hook_text?: string
          id?: string
          is_generated?: boolean | null
          locale?: string
          niche?: string
          platform?: string
          tags?: string[] | null
          tone?: string
        }
        Relationships: []
      }
      pattern_stats: {
        Row: {
          avg_engagement_rate: number | null
          avg_views: number | null
          best_performing_preview: string | null
          category_group: string | null
          category_slug: string | null
          created_at: string | null
          goal: string | null
          id: string
          last_calculated_at: string | null
          pattern_key: string
          platform: string
          tone: string | null
          total_generations: number | null
          total_results: number | null
          user_id: string
          weighted_score: number | null
        }
        Insert: {
          avg_engagement_rate?: number | null
          avg_views?: number | null
          best_performing_preview?: string | null
          category_group?: string | null
          category_slug?: string | null
          created_at?: string | null
          goal?: string | null
          id?: string
          last_calculated_at?: string | null
          pattern_key: string
          platform: string
          tone?: string | null
          total_generations?: number | null
          total_results?: number | null
          user_id: string
          weighted_score?: number | null
        }
        Update: {
          avg_engagement_rate?: number | null
          avg_views?: number | null
          best_performing_preview?: string | null
          category_group?: string | null
          category_slug?: string | null
          created_at?: string | null
          goal?: string | null
          id?: string
          last_calculated_at?: string | null
          pattern_key?: string
          platform?: string
          tone?: string | null
          total_generations?: number | null
          total_results?: number | null
          user_id?: string
          weighted_score?: number | null
        }
        Relationships: []
      }
      persona_event_logs: {
        Row: {
          created_at: string
          event_type: string
          generation_id: string | null
          id: string
          meta: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          generation_id?: string | null
          id?: string
          meta?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          generation_id?: string | null
          id?: string
          meta?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_event_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      planner_requests: {
        Row: {
          audience: string | null
          category_group: string
          category_slug: string
          created_at: string | null
          frequency: number
          goal: string
          id: string
          locale: string
          niche: string
          platform: string
          tone: string | null
          user_id: string
        }
        Insert: {
          audience?: string | null
          category_group?: string
          category_slug?: string
          created_at?: string | null
          frequency?: number
          goal: string
          id?: string
          locale?: string
          niche: string
          platform?: string
          tone?: string | null
          user_id: string
        }
        Update: {
          audience?: string | null
          category_group?: string
          category_slug?: string
          created_at?: string | null
          frequency?: number
          goal?: string
          id?: string
          locale?: string
          niche?: string
          platform?: string
          tone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planner_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          analysis_credit_balance: number
          comped_until: string | null
          created_at: string
          email: string
          id: string
          is_disabled: boolean
          name: string | null
          plan: string
          preferred_locale: string | null
          premium_hooks_until: string | null
          stripe_customer_id: string | null
          xp_balance: number
        }
        Insert: {
          analysis_credit_balance?: number
          comped_until?: string | null
          created_at?: string
          email: string
          id: string
          is_disabled?: boolean
          name?: string | null
          plan?: string
          preferred_locale?: string | null
          premium_hooks_until?: string | null
          stripe_customer_id?: string | null
          xp_balance?: number
        }
        Update: {
          analysis_credit_balance?: number
          comped_until?: string | null
          created_at?: string
          email?: string
          id?: string
          is_disabled?: boolean
          name?: string | null
          plan?: string
          preferred_locale?: string | null
          premium_hooks_until?: string | null
          stripe_customer_id?: string | null
          xp_balance?: number
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          created_at: string
          id: string
          item_id: string
          metadata: Json | null
          user_id: string
          xp_spent: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          metadata?: Json | null
          user_id: string
          xp_spent: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          metadata?: Json | null
          user_id?: string
          xp_spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_cards: {
        Row: {
          card_type: string
          created_at: string
          id: string
          reference_id: string
          share_token: string
          user_id: string
          view_count: number
        }
        Insert: {
          card_type: string
          created_at?: string
          id?: string
          reference_id: string
          share_token?: string
          user_id: string
          view_count?: number
        }
        Update: {
          card_type?: string
          created_at?: string
          id?: string
          reference_id?: string
          share_token?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          reward_type: string
          reward_value: number
          xp_cost: number
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          reward_type: string
          reward_value?: number
          xp_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          reward_type?: string
          reward_value?: number
          xp_cost?: number
        }
        Relationships: []
      }
      usage_daily: {
        Row: {
          analyses_count: number
          created_at: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          analyses_count?: number
          created_at?: string
          date: string
          id?: string
          user_id: string
        }
        Update: {
          analyses_count?: number
          created_at?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_daily_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_hooks: {
        Row: {
          created_at: string | null
          hook_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hook_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          hook_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_hooks_hook_id_fkey"
            columns: ["hook_id"]
            isOneToOne: false
            referencedRelation: "hook_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_hooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mission_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          date: string
          id: string
          mission_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          mission_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          mission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "daily_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_completed_date: string | null
          longest_streak: number
          total_missions_completed: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_completed_date?: string | null
          longest_streak?: number
          total_missions_completed?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_completed_date?: string | null
          longest_streak?: number
          total_missions_completed?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_plans: {
        Row: {
          category_group: string
          category_slug: string
          created_at: string | null
          id: string
          locale: string
          plan_json: Json
          platform: string
          request_id: string
          user_id: string
        }
        Insert: {
          category_group?: string
          category_slug?: string
          created_at?: string | null
          id?: string
          locale: string
          plan_json: Json
          platform?: string
          request_id: string
          user_id: string
        }
        Update: {
          category_group?: string
          category_slug?: string
          created_at?: string | null
          id?: string
          locale?: string
          plan_json?: Json
          platform?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_plans_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "planner_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          source: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          source: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          source?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_performance_score: {
        Args: { p_metrics: Json }
        Returns: number
      }
      earn_xp: {
        Args: {
          p_amount: number
          p_metadata?: Json
          p_source: string
          p_user_id: string
        }
        Returns: {
          new_xp_balance: number
        }[]
      }
      generate_pattern_key: {
        Args: {
          p_category_group: string
          p_category_slug: string
          p_goal: string
          p_platform: string
          p_tone: string
        }
        Returns: string
      }
      get_favorite_count: { Args: { p_user_id: string }; Returns: number }
      get_weekly_plan_count: { Args: { p_user_id: string }; Returns: number }
      initialize_persona_from_onboarding: {
        Args: { p_answers: Json; p_user_id: string }
        Returns: undefined
      }
      normalize_persona_weights: { Args: never; Returns: undefined }
      recalculate_pattern_stats: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      spend_xp_and_redeem: {
        Args: { p_item_id: string; p_user_id: string }
        Returns: {
          error_message: string
          new_analysis_credits: number
          new_premium_hooks_until: string
          new_xp_balance: number
          success: boolean
        }[]
      }
      update_persona_from_events: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      use_analysis_credit: {
        Args: { p_user_id: string }
        Returns: {
          remaining_credits: number
          success: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
