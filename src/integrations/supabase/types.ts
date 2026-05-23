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
      admin_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          brand_id: number | null
          delta: Json | null
          id: number
          ip: string | null
          occurred_at: string
          request_id: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          brand_id?: number | null
          delta?: Json | null
          id?: number
          ip?: string | null
          occurred_at?: string
          request_id?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          brand_id?: number | null
          delta?: Json | null
          id?: number
          ip?: string | null
          occurred_at?: string
          request_id?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          created_at: string
          enabled: boolean
          id: number
          master_category: string
          name: string
          operator_game_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: never
          master_category: string
          name: string
          operator_game_id: string
          provider: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: never
          master_category?: string
          name?: string
          operator_game_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      jackpot_groups: {
        Row: {
          activated_at: string | null
          assigned_categories: string[]
          assigned_game_ids: number[]
          brand_id: number
          contribution_source: string
          contribution_type: string
          created_at: string
          id: number
          master_contribution_value: number
          name: string
          overlapping_rule: string
          status: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          assigned_categories?: string[]
          assigned_game_ids?: number[]
          brand_id: number
          contribution_source?: string
          contribution_type?: string
          created_at?: string
          id?: number
          master_contribution_value?: number
          name: string
          overlapping_rule?: string
          status?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          assigned_categories?: string[]
          assigned_game_ids?: number[]
          brand_id?: number
          contribution_source?: string
          contribution_type?: string
          created_at?: string
          id?: number
          master_contribution_value?: number
          name?: string
          overlapping_rule?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      jackpot_pools: {
        Row: {
          current_balance: number
          id: number
          jackpot_id: number
        }
        Insert: {
          current_balance?: number
          id?: number
          jackpot_id: number
        }
        Update: {
          current_balance?: number
          id?: number
          jackpot_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "jackpot_pools_jackpot_id_fkey"
            columns: ["jackpot_id"]
            isOneToOne: false
            referencedRelation: "jackpots"
            referencedColumns: ["id"]
          },
        ]
      }
      jackpot_seeds: {
        Row: {
          base_seed_amount: number
          id: number
          jackpot_id: number
        }
        Insert: {
          base_seed_amount?: number
          id?: number
          jackpot_id: number
        }
        Update: {
          base_seed_amount?: number
          id?: number
          jackpot_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "jackpot_seeds_jackpot_id_fkey"
            columns: ["jackpot_id"]
            isOneToOne: false
            referencedRelation: "jackpots"
            referencedColumns: ["id"]
          },
        ]
      }
      jackpot_transactions: {
        Row: {
          attributes: Json | null
          brand_id: number
          group_id: number | null
          processed_at: string
          response: Json | null
          totals: Json
          transaction_id: string
        }
        Insert: {
          attributes?: Json | null
          brand_id: number
          group_id?: number | null
          processed_at?: string
          response?: Json | null
          totals?: Json
          transaction_id: string
        }
        Update: {
          attributes?: Json | null
          brand_id?: number
          group_id?: number | null
          processed_at?: string
          response?: Json | null
          totals?: Json
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jackpot_transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "jackpot_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      jackpot_wins: {
        Row: {
          amount: number
          created_at: string
          id: number
          jackpot_id: number
          player_id: string | null
          status: string
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: number
          jackpot_id: number
          player_id?: string | null
          status?: string
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: number
          jackpot_id?: number
          player_id?: string | null
          status?: string
          transaction_id?: string
        }
        Relationships: []
      }
      jackpots: {
        Row: {
          assigned_categories: string[]
          assigned_game_ids: number[]
          brand_id: number
          contribution_percentage: number
          created_at: string
          enabled: boolean
          group_id: number | null
          id: number
          name: string
          split_share: number
          tier_rank: number | null
          trigger_condition: Json
          trigger_probability: number
          updated_at: string
          volatility: number
        }
        Insert: {
          assigned_categories?: string[]
          assigned_game_ids?: number[]
          brand_id: number
          contribution_percentage?: number
          created_at?: string
          enabled?: boolean
          group_id?: number | null
          id?: number
          name: string
          split_share?: number
          tier_rank?: number | null
          trigger_condition?: Json
          trigger_probability?: number
          updated_at?: string
          volatility?: number
        }
        Update: {
          assigned_categories?: string[]
          assigned_game_ids?: number[]
          brand_id?: number
          contribution_percentage?: number
          created_at?: string
          enabled?: boolean
          group_id?: number | null
          id?: number
          name?: string
          split_share?: number
          tier_rank?: number | null
          trigger_condition?: Json
          trigger_probability?: number
          updated_at?: string
          volatility?: number
        }
        Relationships: [
          {
            foreignKeyName: "jackpots_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "jackpot_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          enabled: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_group_bet: { Args: { p_payload: Json }; Returns: Json }
      apply_jackpot_topup: {
        Args: {
          p_actor_user_id?: string
          p_amount: number
          p_brand_id?: number
          p_is_seed: boolean
          p_jackpot_id: number
          p_request_id?: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
