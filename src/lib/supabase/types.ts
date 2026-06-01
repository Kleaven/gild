export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          community_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          community_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          community_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_url: string | null
          course_id: string
          created_at: string
          enrollment_id: string
          id: string
          issued_at: string
          user_id: string
          verification_token: string
        }
        Insert: {
          certificate_url?: string | null
          course_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          issued_at?: string
          user_id: string
          verification_token?: string
        }
        Update: {
          certificate_url?: string | null
          course_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          issued_at?: string
          user_id?: string
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          body: string
          community_id: string
          created_at: string
          deleted_at: string | null
          hot_score: number
          id: string
          is_flagged: boolean
          like_count: number
          parent_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          community_id: string
          created_at?: string
          deleted_at?: string | null
          hot_score?: number
          id?: string
          is_flagged?: boolean
          like_count?: number
          parent_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          community_id?: string
          created_at?: string
          deleted_at?: string | null
          hot_score?: number
          id?: string
          is_flagged?: boolean
          like_count?: number
          parent_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          banner_url: string | null
          category: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          goodbye_message: string | null
          id: string
          is_private: boolean
          logo_url: string | null
          member_count: number
          name: string
          owner_id: string
          plan: string
          platform_fee_percent: number
          price_amount: number | null
          price_currency: string
          pricing_period: string
          pricing_type: string
          role_permissions: Json
          search_vector: unknown
          slug: string
          stripe_connect_account_id: string | null
          stripe_connect_charges_enabled: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          theme_hue: number | null
          trial_ends_at: string | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          banner_url?: string | null
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          goodbye_message?: string | null
          id?: string
          is_private?: boolean
          logo_url?: string | null
          member_count?: number
          name: string
          owner_id: string
          plan?: string
          platform_fee_percent?: number
          price_amount?: number | null
          price_currency?: string
          pricing_period?: string
          pricing_type?: string
          role_permissions?: Json
          search_vector?: unknown
          slug: string
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          theme_hue?: number | null
          trial_ends_at?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          banner_url?: string | null
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          goodbye_message?: string | null
          id?: string
          is_private?: boolean
          logo_url?: string | null
          member_count?: number
          name?: string
          owner_id?: string
          plan?: string
          platform_fee_percent?: number
          price_amount?: number | null
          price_currency?: string
          pricing_period?: string
          pricing_type?: string
          role_permissions?: Json
          search_vector?: unknown
          slug?: string
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          theme_hue?: number | null
          trial_ends_at?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_invite_links: {
        Row: {
          community_id: string
          created_at: string
          creator_id: string
          expires_at: string | null
          id: string
          max_uses: number | null
          token: string
          uses: number
        }
        Insert: {
          community_id: string
          created_at?: string
          creator_id: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          token?: string
          uses?: number
        }
        Update: {
          community_id?: string
          created_at?: string
          creator_id?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          token?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_invite_links_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_invite_links_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          broadcast_opt_out: boolean
          community_id: string
          created_at: string
          id: string
          joined_at: string
          permissions: Json
          role: Database["public"]["Enums"]["member_role"]
          tier_id: string | null
          unsubscribe_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          broadcast_opt_out?: boolean
          community_id: string
          created_at?: string
          id?: string
          joined_at?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["member_role"]
          tier_id?: string | null
          unsubscribe_token?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          broadcast_opt_out?: boolean
          community_id?: string
          created_at?: string
          id?: string
          joined_at?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["member_role"]
          tier_id?: string | null
          unsubscribe_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "membership_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_revenue: {
        Row: {
          amount: number
          community_id: string
          created_at: string
          currency: string
          id: string
          stripe_invoice_id: string | null
          stripe_session_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          community_id: string
          created_at?: string
          currency?: string
          id?: string
          stripe_invoice_id?: string | null
          stripe_session_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          community_id?: string
          created_at?: string
          currency?: string
          id?: string
          stripe_invoice_id?: string | null
          stripe_session_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_revenue_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_revenue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          community_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_published: boolean
          position: number
          search_vector: unknown
          space_id: string
          title: string
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          position?: number
          search_vector?: unknown
          space_id: string
          title: string
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          position?: number
          search_vector?: unknown
          space_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          created_at: string
          error: string | null
          id: string
          provider_id: string | null
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          template: string
          to_email: string
          to_name: string | null
          updated_at: string
          variables: Json
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          provider_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject: string
          template: string
          to_email: string
          to_name?: string | null
          updated_at?: string
          variables?: Json
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          provider_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
          template?: string
          to_email?: string
          to_name?: string | null
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          enrolled_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          community_id: string | null
          created_at: string
          flag_name: string
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          flag_name: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          community_id?: string | null
          created_at?: string
          flag_name?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          community_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["member_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          community_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["member_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          community_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          lesson_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          lesson_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          lesson_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attachment_urls: string[] | null
          body: string | null
          created_at: string
          drip_days: number | null
          id: string
          image_url: string | null
          is_published: boolean
          module_id: string
          position: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          body?: string | null
          created_at?: string
          drip_days?: number | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          module_id: string
          position?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          body?: string | null
          created_at?: string
          drip_days?: number | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          module_id?: string
          position?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          community_id: string
          created_at: string
          id: string
          mime_type: string
          post_id: string | null
          public_url: string | null
          size_bytes: number
          storage_path: string | null
          type: Database["public"]["Enums"]["media_type"]
          uploader_id: string | null
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          mime_type: string
          post_id?: string | null
          public_url?: string | null
          size_bytes: number
          storage_path?: string | null
          type: Database["public"]["Enums"]["media_type"]
          uploader_id?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          mime_type?: string
          post_id?: string | null
          public_url?: string | null
          size_bytes?: number
          storage_path?: string | null
          type?: Database["public"]["Enums"]["media_type"]
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_tiers: {
        Row: {
          community_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          position: number
          price_month_usd: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          position?: number
          price_month_usd: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          price_month_usd?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_tiers_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          community_id: string | null
          created_at: string
          id: string
          is_read: boolean
          resource_url: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          community_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          resource_url?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          community_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          resource_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          email: string
          id: string
          setup_token: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          setup_token?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          setup_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          body: string
          comment_count: number
          community_id: string
          created_at: string
          deleted_at: string | null
          hot_score: number
          id: string
          is_locked: boolean
          is_pinned: boolean
          like_count: number
          media_urls: string[] | null
          poll_options: Json | null
          search_vector: unknown
          space_id: string
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          comment_count?: number
          community_id: string
          created_at?: string
          deleted_at?: string | null
          hot_score?: number
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          like_count?: number
          media_urls?: string[] | null
          poll_options?: Json | null
          search_vector?: unknown
          space_id: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          comment_count?: number
          community_id?: string
          created_at?: string
          deleted_at?: string | null
          hot_score?: number
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          like_count?: number
          media_urls?: string[] | null
          poll_options?: Json | null
          search_vector?: unknown
          space_id?: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          interests: string[] | null
          occupation: string | null
          persona: string | null
          plan: string | null
          search_vector: unknown
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          interests?: string[] | null
          occupation?: string | null
          persona?: string | null
          plan?: string | null
          search_vector?: unknown
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          interests?: string[] | null
          occupation?: string | null
          persona?: string | null
          plan?: string | null
          search_vector?: unknown
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          attempted_at: string
          enrollment_id: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          answers: Json
          attempted_at?: string
          enrollment_id: string
          id?: string
          passed?: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Update: {
          answers?: Json
          attempted_at?: string
          enrollment_id?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          body: string
          correct_id: string
          created_at: string
          id: string
          options: Json
          position: number
          quiz_id: string
          updated_at: string
        }
        Insert: {
          body: string
          correct_id: string
          created_at?: string
          id?: string
          options: Json
          position?: number
          quiz_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          correct_id?: string
          created_at?: string
          id?: string
          options?: Json
          position?: number
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          pass_score: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          pass_score?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          pass_score?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          community_id: string
          created_at: string
          id: string
          reason: string
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          reason: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          allow_member_posts: boolean
          community_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_private: boolean
          min_role: Database["public"]["Enums"]["member_role"]
          name: string
          permissions: Json
          position: number
          role_permissions: Json
          slug: string
          type: Database["public"]["Enums"]["space_type"]
          updated_at: string
        }
        Insert: {
          allow_member_posts?: boolean
          community_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          min_role?: Database["public"]["Enums"]["member_role"]
          name: string
          permissions?: Json
          position?: number
          role_permissions?: Json
          slug: string
          type?: Database["public"]["Enums"]["space_type"]
          updated_at?: string
        }
        Update: {
          allow_member_posts?: boolean
          community_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          min_role?: Database["public"]["Enums"]["member_role"]
          name?: string
          permissions?: Json
          position?: number
          role_permissions?: Json
          slug?: string
          type?: Database["public"]["Enums"]["space_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          community_id: string
          created_at: string
          emoji: string
          id: string
          target_id: string
          target_type: Database["public"]["Enums"]["vote_target_type"]
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          emoji?: string
          id?: string
          target_id: string
          target_type: Database["public"]["Enums"]["vote_target_type"]
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          emoji?: string
          id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["vote_target_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_credentials: {
        Row: {
          admin_id: string
          backed_up: boolean
          created_at: string
          credential_id: string
          device_type: string
          friendly_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          sign_count: number
          transports: string[] | null
          updated_at: string
        }
        Insert: {
          admin_id: string
          backed_up?: boolean
          created_at?: string
          credential_id: string
          device_type?: string
          friendly_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          sign_count?: number
          transports?: string[] | null
          updated_at?: string
        }
        Update: {
          admin_id?: string
          backed_up?: boolean
          created_at?: string
          credential_id?: string
          device_type?: string
          friendly_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          sign_count?: number
          transports?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webauthn_credentials_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          attempt_count: number
          created_at: string
          error: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          error?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          provider?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          error?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_hot_score: {
        Args: { p_comments: number; p_created_at: string; p_likes: number }
        Returns: number
      }
      check_community_permission: {
        Args: {
          p_community_id: string
          p_permission: string
          p_user_id: string
        }
        Returns: boolean
      }
      check_space_permission: {
        Args: { p_permission: string; p_space_id: string; p_user_id: string }
        Returns: boolean
      }
      complete_lesson: {
        Args: { p_enrollment_id: string; p_lesson_id: string }
        Returns: undefined
      }
      create_community:
        | {
            Args: { p_description?: string; p_name: string; p_slug: string }
            Returns: string
          }
        | {
            Args: {
              p_category?: string
              p_description?: string
              p_goodbye_message?: string
              p_is_private?: boolean
              p_name: string
              p_price_amount?: number
              p_price_currency?: string
              p_pricing_period?: string
              p_pricing_type?: string
              p_slug: string
              p_theme_hue?: number
              p_welcome_message?: string
            }
            Returns: string
          }
      current_user_id: { Args: never; Returns: string }
      current_user_role: {
        Args: { p_community_id: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
      delete_comment: { Args: { p_comment_id: string }; Returns: undefined }
      delete_community: { Args: { p_community_id: string }; Returns: undefined }
      delete_post: { Args: { p_post_id: string }; Returns: undefined }
      enroll_in_course: { Args: { p_course_id: string }; Returns: string }
      get_certificate_by_token: {
        Args: { p_token: string }
        Returns: {
          certificate_url: string
          community_name: string
          course_title: string
          issued_at: string
          recipient_name: string
        }[]
      }
      get_dm_thread: {
        Args: { p_limit?: number; p_other_user_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "direct_messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_reactions_for_targets: {
        Args: {
          p_target_ids: string[]
          p_target_type: Database["public"]["Enums"]["vote_target_type"]
        }
        Returns: {
          count: number
          emoji: string
          target_id: string
          viewer_reacted: boolean
        }[]
      }
      has_platform_subscription: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      is_community_member: {
        Args: { p_community_id: string }
        Returns: boolean
      }
      is_community_owner: { Args: { p_community_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      issue_certificate: { Args: { p_enrollment_id: string }; Returns: string }
      join_community: {
        Args: { p_community_id: string; p_invite_token?: string }
        Returns: undefined
      }
      leave_community: { Args: { p_community_id: string }; Returns: undefined }
      set_broadcast_opt_out: {
        Args: { p_community_id: string; p_opt_out: boolean }
        Returns: undefined
      }
      toggle_vote: {
        Args: {
          p_community_id: string
          p_emoji?: string
          p_target_id: string
          p_target_type: Database["public"]["Enums"]["vote_target_type"]
        }
        Returns: boolean
      }
      transfer_community_ownership: {
        Args: { p_community_id: string; p_new_owner_id: string }
        Returns: undefined
      }
      update_member_permissions: {
        Args: { p_community_id: string; p_permissions: Json; p_user_id: string }
        Returns: undefined
      }
      update_member_role: {
        Args: {
          p_community_id: string
          p_new_role: Database["public"]["Enums"]["member_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      user_has_min_role: {
        Args: {
          p_community_id: string
          p_min_role: Database["public"]["Enums"]["member_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      email_status: "pending" | "sent" | "failed" | "cancelled"
      media_type: "image" | "video" | "file"
      member_role:
        | "owner"
        | "admin"
        | "moderator"
        | "tier2_member"
        | "tier1_member"
        | "free_member"
        | "banned"
      notification_type:
        | "new_comment"
        | "new_post"
        | "comment_reply"
        | "course_enrolled"
        | "course_completed"
        | "certificate_issued"
        | "membership_expiring"
        | "membership_expired"
        | "post_liked"
        | "comment_liked"
      report_status: "pending" | "resolved_removed" | "resolved_dismissed"
      report_target_type: "post" | "comment"
      space_type: "feed" | "course" | "events" | "members" | "chat"
      vote_target_type: "post" | "comment"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      email_status: ["pending", "sent", "failed", "cancelled"],
      media_type: ["image", "video", "file"],
      member_role: [
        "owner",
        "admin",
        "moderator",
        "tier2_member",
        "tier1_member",
        "free_member",
        "banned",
      ],
      notification_type: [
        "new_comment",
        "new_post",
        "comment_reply",
        "course_enrolled",
        "course_completed",
        "certificate_issued",
        "membership_expiring",
        "membership_expired",
        "post_liked",
        "comment_liked",
      ],
      report_status: ["pending", "resolved_removed", "resolved_dismissed"],
      report_target_type: ["post", "comment"],
      space_type: ["feed", "course", "events", "members", "chat"],
      vote_target_type: ["post", "comment"],
    },
  },
} as const

