/**
 * Supabase sxemasidan avtomatik yaratilgan turlar (sofriva-staging, Sprint 2).
 * Qo‘lda tahrirlanmaydi: migratsiyadan keyin `npm run db:types` bilan qayta yaratiladi.
 */
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          restaurant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: never
          restaurant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: never
          restaurant_id?: string | null
        }
        Relationships: []
      }
      booking_rules: {
        Row: {
          branch_id: string
          cancellation_cutoff_minutes: number
          confirmation_mode: Database["public"]["Enums"]["confirmation_mode"]
          default_duration_minutes: number
          guest_can_choose_table: boolean
          last_seating_before_close_minutes: number
          max_active_reservations_per_guest: number
          max_advance_days: number
          max_party_size: number
          min_lead_minutes: number
          min_party_size: number
          pending_hold_minutes: number
          restaurant_id: string
          slot_interval_minutes: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          cancellation_cutoff_minutes?: number
          confirmation_mode?: Database["public"]["Enums"]["confirmation_mode"]
          default_duration_minutes?: number
          guest_can_choose_table?: boolean
          last_seating_before_close_minutes?: number
          max_active_reservations_per_guest?: number
          max_advance_days?: number
          max_party_size?: number
          min_lead_minutes?: number
          min_party_size?: number
          pending_hold_minutes?: number
          restaurant_id: string
          slot_interval_minutes?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          cancellation_cutoff_minutes?: number
          confirmation_mode?: Database["public"]["Enums"]["confirmation_mode"]
          default_duration_minutes?: number
          guest_can_choose_table?: boolean
          last_seating_before_close_minutes?: number
          max_active_reservations_per_guest?: number
          max_advance_days?: number
          max_party_size?: number
          min_lead_minutes?: number
          min_party_size?: number
          pending_hold_minutes?: number
          restaurant_id?: string
          slot_interval_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_rules_branch_id_restaurant_id_fkey"
            columns: ["branch_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_branches"
            referencedColumns: ["id", "restaurant_id"]
          },
        ]
      }
      cuisines: {
        Row: {
          code: string
          name: Json
          sort_order: number
        }
        Insert: {
          code: string
          name: Json
          sort_order?: number
        }
        Update: {
          code?: string
          name?: Json
          sort_order?: number
        }
        Relationships: []
      }
      districts: {
        Row: {
          city: string
          code: string
          name: Json
          sort_order: number
        }
        Insert: {
          city?: string
          code: string
          name: Json
          sort_order?: number
        }
        Update: {
          city?: string
          code?: string
          name?: Json
          sort_order?: number
        }
        Relationships: []
      }
      facility_types: {
        Row: {
          code: string
          has_details: boolean
          icon: string
          name: Json
          sort_order: number
        }
        Insert: {
          code: string
          has_details?: boolean
          icon: string
          name: Json
          sort_order?: number
        }
        Update: {
          code?: string
          has_details?: boolean
          icon?: string
          name?: Json
          sort_order?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          attempts: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          dedupe_key: string | null
          id: string
          last_error: string | null
          payload: Json
          recipient_chat_id: number | null
          recipient_user_id: string | null
          reservation_id: string | null
          restaurant_id: string | null
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          type: string
        }
        Insert: {
          attempts?: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          dedupe_key?: string | null
          id?: string
          last_error?: string | null
          payload?: Json
          recipient_chat_id?: number | null
          recipient_user_id?: string | null
          reservation_id?: string | null
          restaurant_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          type: string
        }
        Update: {
          attempts?: number
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          dedupe_key?: string | null
          id?: string
          last_error?: string | null
          payload?: Json
          recipient_chat_id?: number | null
          recipient_user_id?: string | null
          reservation_id?: string | null
          restaurant_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_hour_exceptions: {
        Row: {
          branch_id: string
          closes_at: string | null
          date: string
          id: number
          is_closed: boolean
          note: Json
          opens_at: string | null
          restaurant_id: string
        }
        Insert: {
          branch_id: string
          closes_at?: string | null
          date: string
          id?: never
          is_closed: boolean
          note?: Json
          opens_at?: string | null
          restaurant_id: string
        }
        Update: {
          branch_id?: string
          closes_at?: string | null
          date?: string
          id?: never
          is_closed?: boolean
          note?: Json
          opens_at?: string | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opening_hour_exceptions_branch_id_restaurant_id_fkey"
            columns: ["branch_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_branches"
            referencedColumns: ["id", "restaurant_id"]
          },
        ]
      }
      opening_hours: {
        Row: {
          branch_id: string
          closes_at: string
          id: number
          opens_at: string
          restaurant_id: string
          weekday: number
        }
        Insert: {
          branch_id: string
          closes_at: string
          id?: never
          opens_at: string
          restaurant_id: string
          weekday: number
        }
        Update: {
          branch_id?: string
          closes_at?: string
          id?: never
          opens_at?: string
          restaurant_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "opening_hours_branch_id_restaurant_id_fkey"
            columns: ["branch_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_branches"
            referencedColumns: ["id", "restaurant_id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          locale: string
          phone: string | null
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reservation_guests: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_primary: boolean
          phone: string | null
          reservation_id: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_primary?: boolean
          phone?: string | null
          reservation_id: string
          restaurant_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_primary?: boolean
          phone?: string | null
          reservation_id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_guests_reservation_id_restaurant_id_fkey"
            columns: ["reservation_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id", "restaurant_id"]
          },
        ]
      }
      reservation_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["reservation_status"] | null
          id: number
          reason: string | null
          reservation_id: string
          restaurant_id: string
          to_status: Database["public"]["Enums"]["reservation_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["reservation_status"] | null
          id?: never
          reason?: string | null
          reservation_id: string
          restaurant_id: string
          to_status: Database["public"]["Enums"]["reservation_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["reservation_status"] | null
          id?: never
          reason?: string | null
          reservation_id?: string
          restaurant_id?: string
          to_status?: Database["public"]["Enums"]["reservation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reservation_status_history_reservation_id_restaurant_id_fkey"
            columns: ["reservation_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id", "restaurant_id"]
          },
        ]
      }
      reservations: {
        Row: {
          branch_id: string
          cancelled_at: string | null
          cancelled_by: string | null
          checked_in_at: string | null
          code: string
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          ends_at: string
          hall_id: string | null
          hold_expires_at: string | null
          id: string
          idempotency_key: string | null
          party_size: number
          restaurant_id: string
          source: Database["public"]["Enums"]["reservation_source"]
          special_requests: string | null
          starts_at: string
          status: Database["public"]["Enums"]["reservation_status"]
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          checked_in_at?: string | null
          code?: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          ends_at: string
          hall_id?: string | null
          hold_expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          party_size: number
          restaurant_id: string
          source: Database["public"]["Enums"]["reservation_source"]
          special_requests?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["reservation_status"]
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          checked_in_at?: string | null
          code?: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          ends_at?: string
          hall_id?: string | null
          hold_expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          party_size?: number
          restaurant_id?: string
          source?: Database["public"]["Enums"]["reservation_source"]
          special_requests?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          status_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_branch_id_restaurant_id_fkey"
            columns: ["branch_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_branches"
            referencedColumns: ["id", "restaurant_id"]
          },
          {
            foreignKeyName: "reservations_hall_id_branch_id_restaurant_id_fkey"
            columns: ["hall_id", "branch_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_halls"
            referencedColumns: ["id", "branch_id", "restaurant_id"]
          },
        ]
      }
      restaurant_branches: {
        Row: {
          address: Json
          created_at: string
          district_code: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          latitude: number | null
          longitude: number | null
          name: Json
          phone: string | null
          price_level: number | null
          restaurant_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: Json
          created_at?: string
          district_code?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: Json
          phone?: string | null
          price_level?: number | null
          restaurant_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: Json
          created_at?: string
          district_code?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: Json
          phone?: string | null
          price_level?: number | null
          restaurant_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_branches_district_code_fkey"
            columns: ["district_code"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "restaurant_branches_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_cuisines: {
        Row: {
          branch_id: string
          cuisine_code: string
          restaurant_id: string
        }
        Insert: {
          branch_id: string
          cuisine_code: string
          restaurant_id: string
        }
        Update: {
          branch_id?: string
          cuisine_code?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_cuisines_branch_id_restaurant_id_fkey"
            columns: ["branch_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_branches"
            referencedColumns: ["id", "restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_cuisines_cuisine_code_fkey"
            columns: ["cuisine_code"]
            isOneToOne: false
            referencedRelation: "cuisines"
            referencedColumns: ["code"]
          },
        ]
      }
      restaurant_facilities: {
        Row: {
          branch_id: string
          details: Json
          facility_code: string
          restaurant_id: string
        }
        Insert: {
          branch_id: string
          details?: Json
          facility_code: string
          restaurant_id: string
        }
        Update: {
          branch_id?: string
          details?: Json
          facility_code?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_facilities_branch_id_restaurant_id_fkey"
            columns: ["branch_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_branches"
            referencedColumns: ["id", "restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_facilities_facility_code_fkey"
            columns: ["facility_code"]
            isOneToOne: false
            referencedRelation: "facility_types"
            referencedColumns: ["code"]
          },
        ]
      }
      restaurant_halls: {
        Row: {
          background_media_id: string | null
          branch_id: string
          capacity: number | null
          created_at: string
          description: Json
          hall_type: Database["public"]["Enums"]["hall_type"]
          id: string
          is_active: boolean
          name: Json
          plan_height: number
          plan_width: number
          restaurant_id: string
          restrictions: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          background_media_id?: string | null
          branch_id: string
          capacity?: number | null
          created_at?: string
          description?: Json
          hall_type?: Database["public"]["Enums"]["hall_type"]
          id?: string
          is_active?: boolean
          name: Json
          plan_height?: number
          plan_width?: number
          restaurant_id: string
          restrictions?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          background_media_id?: string | null
          branch_id?: string
          capacity?: number | null
          created_at?: string
          description?: Json
          hall_type?: Database["public"]["Enums"]["hall_type"]
          id?: string
          is_active?: boolean
          name?: Json
          plan_height?: number
          plan_width?: number
          restaurant_id?: string
          restrictions?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_halls_background_media_fk"
            columns: ["background_media_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_media"
            referencedColumns: ["id", "restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_halls_branch_id_restaurant_id_fkey"
            columns: ["branch_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_branches"
            referencedColumns: ["id", "restaurant_id"]
          },
        ]
      }
      restaurant_media: {
        Row: {
          alt: Json
          branch_id: string
          created_at: string
          duration_seconds: number | null
          facility_code: string | null
          hall_id: string | null
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          poster_path: string | null
          rejection_reason: string | null
          restaurant_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          rights_confirmed: boolean
          sort_order: number
          status: Database["public"]["Enums"]["media_status"]
          storage_path: string | null
          stream_uid: string | null
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt?: Json
          branch_id: string
          created_at?: string
          duration_seconds?: number | null
          facility_code?: string | null
          hall_id?: string | null
          height?: number | null
          id?: string
          kind: Database["public"]["Enums"]["media_kind"]
          poster_path?: string | null
          rejection_reason?: string | null
          restaurant_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rights_confirmed: boolean
          sort_order?: number
          status?: Database["public"]["Enums"]["media_status"]
          storage_path?: string | null
          stream_uid?: string | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt?: Json
          branch_id?: string
          created_at?: string
          duration_seconds?: number | null
          facility_code?: string | null
          hall_id?: string | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          poster_path?: string | null
          rejection_reason?: string | null
          restaurant_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rights_confirmed?: boolean
          sort_order?: number
          status?: Database["public"]["Enums"]["media_status"]
          storage_path?: string | null
          stream_uid?: string | null
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_media_branch_id_restaurant_id_fkey"
            columns: ["branch_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_branches"
            referencedColumns: ["id", "restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_media_facility_code_fkey"
            columns: ["facility_code"]
            isOneToOne: false
            referencedRelation: "facility_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "restaurant_media_hall_id_branch_id_restaurant_id_fkey"
            columns: ["hall_id", "branch_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_halls"
            referencedColumns: ["id", "branch_id", "restaurant_id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          branch_id: string
          created_at: string
          hall_id: string
          height: number
          id: string
          is_active: boolean
          is_online_bookable: boolean
          label: string
          max_party: number
          min_party: number
          pos_x: number
          pos_y: number
          restaurant_id: string
          rotation: number
          shape: Database["public"]["Enums"]["table_shape"]
          updated_at: string
          width: number
        }
        Insert: {
          branch_id: string
          created_at?: string
          hall_id: string
          height?: number
          id?: string
          is_active?: boolean
          is_online_bookable?: boolean
          label: string
          max_party: number
          min_party?: number
          pos_x?: number
          pos_y?: number
          restaurant_id: string
          rotation?: number
          shape?: Database["public"]["Enums"]["table_shape"]
          updated_at?: string
          width?: number
        }
        Update: {
          branch_id?: string
          created_at?: string
          hall_id?: string
          height?: number
          id?: string
          is_active?: boolean
          is_online_bookable?: boolean
          label?: string
          max_party?: number
          min_party?: number
          pos_x?: number
          pos_y?: number
          restaurant_id?: string
          rotation?: number
          shape?: Database["public"]["Enums"]["table_shape"]
          updated_at?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_hall_id_branch_id_restaurant_id_fkey"
            columns: ["hall_id", "branch_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_halls"
            referencedColumns: ["id", "branch_id", "restaurant_id"]
          },
        ]
      }
      restaurants: {
        Row: {
          created_at: string
          created_by: string | null
          description: Json
          id: string
          name: Json
          published_at: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          status: Database["public"]["Enums"]["restaurant_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: Json
          id?: string
          name: Json
          published_at?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          status?: Database["public"]["Enums"]["restaurant_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: Json
          id?: string
          name?: Json
          published_at?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["restaurant_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          expires_at: string
          id: string
          invited_by: string | null
          phone: string
          restaurant_id: string
          role: Database["public"]["Enums"]["staff_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          phone: string
          restaurant_id: string
          role: Database["public"]["Enums"]["staff_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          phone?: string
          restaurant_id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          created_at: string
          invited_by: string | null
          is_active: boolean
          restaurant_id: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          is_active?: boolean
          restaurant_id: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          is_active?: boolean
          restaurant_id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      table_allocations: {
        Row: {
          active: boolean
          branch_id: string
          created_at: string
          created_by: string | null
          id: number
          kind: Database["public"]["Enums"]["allocation_kind"]
          period: unknown
          reason: string | null
          reservation_id: string | null
          restaurant_id: string
          table_id: string
        }
        Insert: {
          active?: boolean
          branch_id: string
          created_at?: string
          created_by?: string | null
          id?: never
          kind: Database["public"]["Enums"]["allocation_kind"]
          period: unknown
          reason?: string | null
          reservation_id?: string | null
          restaurant_id: string
          table_id: string
        }
        Update: {
          active?: boolean
          branch_id?: string
          created_at?: string
          created_by?: string | null
          id?: never
          kind?: Database["public"]["Enums"]["allocation_kind"]
          period?: unknown
          reason?: string | null
          reservation_id?: string | null
          restaurant_id?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_allocations_reservation_id_restaurant_id_fkey"
            columns: ["reservation_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id", "restaurant_id"]
          },
          {
            foreignKeyName: "table_allocations_table_id_branch_id_restaurant_id_fkey"
            columns: ["table_id", "branch_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id", "branch_id", "restaurant_id"]
          },
        ]
      }
      table_features: {
        Row: {
          feature: Database["public"]["Enums"]["table_feature"]
          restaurant_id: string
          table_id: string
        }
        Insert: {
          feature: Database["public"]["Enums"]["table_feature"]
          restaurant_id: string
          table_id: string
        }
        Update: {
          feature?: Database["public"]["Enums"]["table_feature"]
          restaurant_id?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_features_table_id_restaurant_id_fkey"
            columns: ["table_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id", "restaurant_id"]
          },
        ]
      }
      telegram_links: {
        Row: {
          chat_id: number | null
          created_at: string
          id: string
          is_active: boolean
          link_code_expires_at: string | null
          link_code_hash: string | null
          linked_at: string | null
          restaurant_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          chat_id?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          link_code_expires_at?: string | null
          link_code_hash?: string | null
          linked_at?: string | null
          restaurant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          chat_id?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          link_code_expires_at?: string | null
          link_code_hash?: string | null
          linked_at?: string | null
          restaurant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_links_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_staff_invitation: {
        Args: { p_invitation_id: string }
        Returns: string
      }
      admin_overview: { Args: never; Returns: Json }
      complete_onboarding: {
        Args: { p_full_name: string; p_locale: string }
        Returns: undefined
      }
      decline_staff_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      get_my_access: { Args: never; Returns: Json }
      get_restaurant_staff: {
        Args: { p_restaurant_id: string }
        Returns: {
          full_name: string
          is_active: boolean
          joined_at: string
          phone: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }[]
      }
      invite_staff: {
        Args: {
          p_phone: string
          p_restaurant_id: string
          p_role: Database["public"]["Enums"]["staff_role"]
        }
        Returns: string
      }
      my_staff_invitations: {
        Args: never
        Returns: {
          created_at: string
          expires_at: string
          id: string
          restaurant_id: string
          restaurant_name: Json
          role: Database["public"]["Enums"]["staff_role"]
        }[]
      }
      register_sms_attempt: { Args: { p_phone: string }; Returns: Json }
      revoke_staff_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      set_staff_member_active: {
        Args: { p_active: boolean; p_restaurant_id: string; p_user_id: string }
        Returns: undefined
      }
      set_staff_member_role: {
        Args: {
          p_restaurant_id: string
          p_role: Database["public"]["Enums"]["staff_role"]
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      allocation_kind: "reservation" | "block"
      confirmation_mode: "auto" | "manual"
      hall_type:
        | "main"
        | "vip"
        | "family"
        | "terrace"
        | "banquet"
        | "private"
        | "kids"
      invitation_status:
        | "pending"
        | "accepted"
        | "revoked"
        | "expired"
        | "declined"
      media_kind: "photo" | "video"
      media_status: "pending_review" | "approved" | "rejected"
      notification_channel: "telegram" | "in_app"
      notification_status: "pending" | "sent" | "failed" | "skipped"
      reservation_source:
        | "sofriva"
        | "direct_link"
        | "qr"
        | "phone"
        | "walk_in"
        | "instagram"
        | "telegram"
        | "widget"
        | "other"
      reservation_status:
        | "pending"
        | "awaiting_payment"
        | "confirmed"
        | "checked_in"
        | "completed"
        | "cancelled"
        | "rejected"
        | "expired"
        | "no_show"
      restaurant_status:
        | "draft"
        | "pending_review"
        | "published"
        | "rejected"
        | "suspended"
      staff_role: "owner" | "manager" | "host" | "staff"
      table_feature:
        | "window"
        | "sofa"
        | "quiet_zone"
        | "smoking_area"
        | "outdoor"
        | "wheelchair_accessible"
        | "near_kids_area"
        | "stage_view"
      table_shape: "round" | "square" | "rectangle"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      allocation_kind: ["reservation", "block"],
      confirmation_mode: ["auto", "manual"],
      hall_type: [
        "main",
        "vip",
        "family",
        "terrace",
        "banquet",
        "private",
        "kids",
      ],
      invitation_status: ["pending", "accepted", "revoked", "expired", "declined"],
      media_kind: ["photo", "video"],
      media_status: ["pending_review", "approved", "rejected"],
      notification_channel: ["telegram", "in_app"],
      notification_status: ["pending", "sent", "failed", "skipped"],
      reservation_source: [
        "sofriva",
        "direct_link",
        "qr",
        "phone",
        "walk_in",
        "instagram",
        "telegram",
        "widget",
        "other",
      ],
      reservation_status: [
        "pending",
        "awaiting_payment",
        "confirmed",
        "checked_in",
        "completed",
        "cancelled",
        "rejected",
        "expired",
        "no_show",
      ],
      restaurant_status: [
        "draft",
        "pending_review",
        "published",
        "rejected",
        "suspended",
      ],
      staff_role: ["owner", "manager", "host", "staff"],
      table_feature: [
        "window",
        "sofa",
        "quiet_zone",
        "smoking_area",
        "outdoor",
        "wheelchair_accessible",
        "near_kids_area",
        "stage_view",
      ],
      table_shape: ["round", "square", "rectangle"],
    },
  },
} as const
