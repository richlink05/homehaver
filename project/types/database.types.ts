// 이 파일은 임시 타입입니다. Supabase 프로젝트 연결 후 아래 명령으로 실제 스키마 기반 타입을
// 자동 생성해서 교체하는 것을 권장합니다:
//
//   npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
//
// 지금은 마이그레이션(schema.sql) 기준으로 손으로 작성한 최소 타입입니다.
// ⚠️ @supabase/supabase-js 2.45+ 는 각 테이블에 Relationships 필드가 있어야
//    select()/eq() 등의 타입 추론이 정상 동작합니다 (없으면 Row가 never로 추론될 수 있음).

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
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          agency_id: string | null;
          region_id: string | null;
          builder_id: string | null;
          title: string;
          type: "아파트" | "오피스텔" | "지식산업센터" | "상가";
          status: "분양예정" | "분양중" | "계약중" | "마감";
          price_min: number | null;
          price_max: number | null;
          move_in_date: string | null;
          address: string | null;
          lat: number | null;
          lng: number | null;
          description: string | null;
          manager_name: string | null;
          manager_phone: string | null;
          view_count: number;
          like_count: number;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["listings"]["Row"]> & { title: string; type: string };
        Update: Partial<Database["public"]["Tables"]["listings"]["Row"]>;
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
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          image_url: string;
          category: "대표" | "평면도" | "배치도" | "영상" | null;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["listing_images"]["Row"]> & {
          listing_id: string;
          image_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["listing_images"]["Row"]>;
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
        Insert: Partial<Database["public"]["Tables"]["inquiries"]["Row"]> & {
          listing_id: string;
          name: string;
          phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["inquiries"]["Row"]>;
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
        Insert: Partial<Database["public"]["Tables"]["favorites"]["Row"]> & {
          listing_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["favorites"]["Row"]>;
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
        Insert: Partial<Database["public"]["Tables"]["builders"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["builders"]["Row"]>;
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
        Insert: Partial<Database["public"]["Tables"]["admin_banners"]["Row"]> & { image_url: string };
        Update: Partial<Database["public"]["Tables"]["admin_banners"]["Row"]>;
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
        Insert: Partial<Database["public"]["Tables"]["admin_notices"]["Row"]> & {
          title: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_notices"]["Row"]>;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
