// 이 파일은 임시 타입입니다. Supabase 프로젝트 연결 후 아래 명령으로 실제 스키마 기반 타입을
// 자동 생성해서 교체하는 것을 권장합니다:
//
//   npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
//
// 지금은 마이그레이션(schema.sql) 기준으로 손으로 작성한 최소 타입입니다.
//
// ⚠️ Insert/Update 타입은 반드시 "평범한 객체 타입"으로 직접 나열해야 합니다.
//    Partial<Row> & {...} 같은 자기참조/교차 타입으로 축약하면 @supabase/supabase-js의
//    insert()/upsert()/update() 제네릭 추론이 깨져 "never[]"로 잡히는 문제가 생깁니다.
//    (select 계열은 Relationships 필드 누락 시 같은 종류의 문제가 생깁니다.)

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "user" | "agency" | "admin";
          name: string | null;
          phone: string | null;
          email: string | null;
          company_name: string | null;
          is_approved: boolean;
          points: number;
          banned: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: "user" | "agency" | "admin";
          name?: string | null;
          phone?: string | null;
          email?: string | null;
          company_name?: string | null;
          is_approved?: boolean;
          points?: number;
          banned?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: "user" | "agency" | "admin";
          name?: string | null;
          phone?: string | null;
          email?: string | null;
          company_name?: string | null;
          is_approved?: boolean;
          points?: number;
          banned?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      point_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: "충전" | "사용" | "환불";
          amount: number;
          note: string | null;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "충전" | "사용" | "환불";
          amount: number;
          note?: string | null;
          balance_after: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "충전" | "사용" | "환불";
          amount?: number;
          note?: string | null;
          balance_after?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "point_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      listings: {
        Row: {
          id: string;
          agency_id: string | null;
          region_id: string | null;
          builder_id: string | null;
          title: string;
          type: "아파트" | "오피스텔";
          status: "분양예정" | "분양중" | "마감";
          price_min: number | null;
          price_max: number | null;
          area_min: number | null;
          area_max: number | null;
          unit_count: number | null;
          building_count: number | null;
          top_floor: number | null;
          registrant_id: string | null;
          tenure_start: string | null;
          last_deduction_date: string | null;
          move_in_date: string | null;
          address: string | null;
          lat: number | null;
          lng: number | null;
          description: string | null;
          thumbnail_url: string | null;
          manager_name: string | null;
          manager_phone: string | null;
          view_count: number;
          like_count: number;
          is_approved: boolean;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id?: string | null;
          region_id?: string | null;
          builder_id?: string | null;
          title: string;
          type: string;
          status?: string;
          price_min?: number | null;
          price_max?: number | null;
          area_min?: number | null;
          area_max?: number | null;
          unit_count?: number | null;
          building_count?: number | null;
          top_floor?: number | null;
          registrant_id?: string | null;
          tenure_start?: string | null;
          last_deduction_date?: string | null;
          move_in_date?: string | null;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          description?: string | null;
          thumbnail_url?: string | null;
          manager_name?: string | null;
          manager_phone?: string | null;
          view_count?: number;
          like_count?: number;
          is_approved?: boolean;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string | null;
          region_id?: string | null;
          builder_id?: string | null;
          title?: string;
          type?: string;
          status?: string;
          price_min?: number | null;
          price_max?: number | null;
          area_min?: number | null;
          area_max?: number | null;
          unit_count?: number | null;
          building_count?: number | null;
          top_floor?: number | null;
          registrant_id?: string | null;
          tenure_start?: string | null;
          last_deduction_date?: string | null;
          move_in_date?: string | null;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          description?: string | null;
          thumbnail_url?: string | null;
          manager_name?: string | null;
          manager_phone?: string | null;
          view_count?: number;
          like_count?: number;
          is_approved?: boolean;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listings_builder_id_fkey";
            columns: ["builder_id"];
            isOneToOne: false;
            referencedRelation: "builders";
            referencedColumns: ["id"];
          }
        ];
      };
      listing_waitlist: {
        Row: {
          id: string;
          listing_id: string;
          user_id: string;
          requested_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          user_id: string;
          requested_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          user_id?: string;
          requested_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_waitlist_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_waitlist_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          image_url: string;
          category: "썸네일" | "평면도" | "인프라" | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          listing_id: string;
          image_url: string;
          category?: "썸네일" | "평면도" | "인프라" | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          listing_id?: string;
          image_url?: string;
          category?: "썸네일" | "평면도" | "인프라" | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          }
        ];
      };
      inquiries: {
        Row: {
          id: string;
          listing_id: string;
          user_id: string | null;
          name: string;
          phone: string;
          message: string | null;
          status: "대기" | "응답완료";
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          user_id?: string | null;
          name: string;
          phone: string;
          message?: string | null;
          status?: "대기" | "응답완료";
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          user_id?: string | null;
          name?: string;
          phone?: string;
          message?: string | null;
          status?: "대기" | "응답완료";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inquiries_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inquiries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      favorites: {
        Row: { id: string; listing_id: string; user_id: string; created_at: string };
        Insert: { id?: string; listing_id: string; user_id: string; created_at?: string };
        Update: { id?: string; listing_id?: string; user_id?: string; created_at?: string };
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      builders: {
        Row: { id: string; name: string; brand_name: string | null; logo_url: string | null };
        Insert: { id?: string; name: string; brand_name?: string | null; logo_url?: string | null };
        Update: { id?: string; name?: string; brand_name?: string | null; logo_url?: string | null };
        Relationships: [];
      };
      admin_banners: {
        Row: {
          id: string;
          image_url: string;
          link_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          image_url: string;
          link_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          image_url?: string;
          link_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "admin_banners_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      admin_notices: {
        Row: {
          id: string;
          title: string;
          content: string;
          is_pinned: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          is_pinned?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          is_pinned?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_notices_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      community_posts: {
        Row: {
          id: string;
          category: "free" | "review" | "qna" | "notice";
          title: string;
          content: string;
          author: string;
          password: string;
          image_url: string | null;
          views: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category: "free" | "review" | "qna" | "notice";
          title: string;
          content: string;
          author: string;
          password: string;
          image_url?: string | null;
          views?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: "free" | "review" | "qna" | "notice";
          title?: string;
          content?: string;
          author?: string;
          password?: string;
          image_url?: string | null;
          views?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      community_comments: {
        Row: {
          id: string;
          post_id: string;
          author: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          }
        ];
      };
      community_reports: {
        Row: {
          id: string;
          post_id: string | null;
          post_title: string;
          post_author: string;
          reason: string;
          detail: string | null;
          evidence_url: string | null;
          status: "대기" | "처리완료" | "반려";
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id?: string | null;
          post_title: string;
          post_author: string;
          reason: string;
          detail?: string | null;
          evidence_url?: string | null;
          status?: "대기" | "처리완료" | "반려";
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string | null;
          post_title?: string;
          post_author?: string;
          reason?: string;
          detail?: string | null;
          evidence_url?: string | null;
          status?: "대기" | "처리완료" | "반려";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_reports_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          }
        ];
      };
      banned_keywords: {
        Row: { id: string; keyword: string; created_at: string };
        Insert: { id?: string; keyword: string; created_at?: string };
        Update: { id?: string; keyword?: string; created_at?: string };
        Relationships: [];
      };
      blocked_authors: {
        Row: { id: string; author_name: string; blocked_at: string };
        Insert: { id?: string; author_name: string; blocked_at?: string };
        Update: { id?: string; author_name?: string; blocked_at?: string };
        Relationships: [];
      };
      search_log: {
        Row: { id: string; term: string; created_at: string };
        Insert: { id?: string; term: string; created_at?: string };
        Update: { id?: string; term?: string; created_at?: string };
        Relationships: [];
      };
      daily_visit_counts: {
        Row: { visit_date: string; count: number };
        Insert: { visit_date: string; count?: number };
        Update: { visit_date?: string; count?: number };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_view_count: {
        Args: { listing_id: string };
        Returns: void;
      };
      add_points: {
        Args: { p_amount: number; p_type: string; p_note: string };
        Returns: number;
      };
      activate_manager: {
        Args: { p_listing_id: string };
        Returns: void;
      };
      join_waitlist: {
        Args: { p_listing_id: string };
        Returns: void;
      };
      stop_managing: {
        Args: { p_listing_id: string };
        Returns: void;
      };
      process_daily_deductions: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      create_post: {
        Args: {
          p_category: string;
          p_title: string;
          p_content: string;
          p_author: string;
          p_password: string;
          p_image_url: string | null;
        };
        Returns: string;
      };
      update_post: {
        Args: {
          p_post_id: string;
          p_password: string;
          p_category: string;
          p_title: string;
          p_content: string;
          p_image_url: string | null;
        };
        Returns: void;
      };
      delete_post: {
        Args: { p_post_id: string; p_password: string };
        Returns: void;
      };
      admin_delete_post: {
        Args: { p_post_id: string };
        Returns: void;
      };
      create_comment: {
        Args: { p_post_id: string; p_author: string; p_content: string };
        Returns: string;
      };
      increment_post_views: {
        Args: { p_post_id: string };
        Returns: void;
      };
      resolve_report: {
        Args: { p_report_id: string; p_action: string };
        Returns: void;
      };
      find_email_by_name_phone: {
        Args: { p_name: string; p_phone: string };
        Returns: string;
      };
      increment_daily_visit: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
