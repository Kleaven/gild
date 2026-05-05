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
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_private: boolean
          logo_url: string | null
          member_count: number
          name: string
          owner_id: string
          plan: string
          search_vector: unknown
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          logo_url?: string | null
          member_count?: number
          name: string
          owner_id: string
          plan?: string
          search_vector?: unknown
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          logo_url?: string | null
          member_count?: number
          name?: string
          owner_id?: string
          plan?: string
          search_vector?: unknown
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
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
      community_members: {
        Row: {
          community_id: string
          created_at: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["member_role"]
          tier_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          tier_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["member_role"]
          tier_id?: string | null
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
      courses: {
        Row: {
          community_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
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
          body: string | null
          created_at: string
          drip_days: number | null
          id: string
          is_published: boolean
          module_id: string
          position: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          drip_days?: number | null
          id?: string
          is_published?: boolean
          module_id: string
          position?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          drip_days?: number | null
          id?: string
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
          search_vector: unknown
          space_id: string
          title: string | null
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
          search_vector?: unknown
          space_id: string
          title?: string | null
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
          search_vector?: unknown
          space_id?: string
          title?: string | null
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
          search_vector: unknown
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          search_vector?: unknown
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          search_vector?: unknown
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
          community_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_private: boolean
          min_role: Database["public"]["Enums"]["member_role"]
          name: string
          position: number
          slug: string
          type: Database["public"]["Enums"]["space_type"]
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          min_role?: Database["public"]["Enums"]["member_role"]
          name: string
          position?: number
          slug: string
          type?: Database["public"]["Enums"]["space_type"]
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          min_role?: Database["public"]["Enums"]["member_role"]
          name?: string
          position?: number
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
          id: string
          target_id: string
          target_type: Database["public"]["Enums"]["vote_target_type"]
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          target_id: string
          target_type: Database["public"]["Enums"]["vote_target_type"]
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
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
      get_certificate_by_token: {
        Args: { p_token: string }
        Returns: {
          issued_at: string
          certificate_url: string | null
          recipient_name: string
          course_title: string
          community_name: string
        }[]
      }
      issue_certificate: {
        Args: { p_enrollment_id: string }
        Returns: string
      }
      complete_lesson: {
        Args: { p_enrollment_id: string; p_lesson_id: string }
        Returns: undefined
      }
      create_community: {
        Args: { p_description?: string; p_name: string; p_slug: string }
        Returns: string
      }
      current_user_id: { Args: never; Returns: string }
      current_user_role: {
        Args: { p_community_id: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
      delete_comment: { Args: { p_comment_id: string }; Returns: undefined }
      delete_post: { Args: { p_post_id: string }; Returns: undefined }
      enroll_in_course: { Args: { p_course_id: string }; Returns: string }
      is_community_member: {
        Args: { p_community_id: string }
        Returns: boolean
      }
      is_community_owner: { Args: { p_community_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      join_community: { Args: { p_community_id: string }; Returns: undefined }
      leave_community: { Args: { p_community_id: string }; Returns: undefined }
      toggle_vote: {
        Args: {
          p_community_id: string
          p_target_id: string
          p_target_type: Database["public"]["Enums"]["vote_target_type"]
        }
        Returns: boolean
      }
      transfer_community_ownership: {
        Args: { p_community_id: string; p_new_owner_id: string }
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
