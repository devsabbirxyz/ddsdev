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
      affiliate_applications: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string
          reason: string | null
          rejection_reason: string | null
          social_links: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone: string
          reason?: string | null
          rejection_reason?: string | null
          social_links?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string
          reason?: string | null
          rejection_reason?: string | null
          social_links?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string | null
          commission_amount: number | null
          created_at: string | null
          id: string
          order_id: string | null
          referred_user_id: string | null
          status: string | null
        }
        Insert: {
          affiliate_id?: string | null
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          referred_user_id?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string | null
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          referred_user_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_withdrawals: {
        Row: {
          account_number: string
          affiliate_id: string | null
          amount: number
          created_at: string | null
          id: string
          payment_method: string
          processed_at: string | null
          rejection_reason: string | null
          status: string | null
        }
        Insert: {
          account_number: string
          affiliate_id?: string | null
          amount: number
          created_at?: string | null
          id?: string
          payment_method: string
          processed_at?: string | null
          rejection_reason?: string | null
          status?: string | null
        }
        Update: {
          account_number?: string
          affiliate_id?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: string
          processed_at?: string | null
          rejection_reason?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          balance: number | null
          commission_rate: number | null
          created_at: string | null
          id: string
          referral_code: string
          rejection_reason: string | null
          status: string | null
          total_earnings: number | null
          total_referrals: number | null
          total_withdrawn: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          referral_code: string
          rejection_reason?: string | null
          status?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          referral_code?: string
          rejection_reason?: string | null
          status?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          name_en: string | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          name_en?: string | null
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          name_en?: string | null
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          category_id: string | null
          content: string | null
          content_en: string | null
          created_at: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          og_image: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          short_description_en: string | null
          slug: string
          thumbnail_url: string | null
          title: string
          title_en: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          content?: string | null
          content_en?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          og_image?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          short_description_en?: string | null
          slug: string
          thumbnail_url?: string | null
          title: string
          title_en?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          content?: string | null
          content_en?: string | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          og_image?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          short_description_en?: string | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          title_en?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cart: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number | null
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number | null
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number | null
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          description_en: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      countdown_timers: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          is_active: boolean | null
          product_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "countdown_timers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_categories: {
        Row: {
          category_id: string | null
          coupon_id: string | null
          id: string
        }
        Insert: {
          category_id?: string | null
          coupon_id?: string | null
          id?: string
        }
        Update: {
          category_id?: string | null
          coupon_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_categories_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_products: {
        Row: {
          coupon_id: string | null
          id: string
          product_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          id?: string
          product_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_products_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string | null
          created_at: string | null
          discount_amount: number | null
          id: string
          order_id: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to: string | null
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_user: number | null
          minimum_order: number | null
          start_date: string | null
          updated_at: string | null
          used_count: number | null
        }
        Insert: {
          applies_to?: string | null
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          minimum_order?: number | null
          start_date?: string | null
          updated_at?: string | null
          used_count?: number | null
        }
        Update: {
          applies_to?: string | null
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          minimum_order?: number | null
          start_date?: string | null
          updated_at?: string | null
          used_count?: number | null
        }
        Relationships: []
      }
      developer_page: {
        Row: {
          bio: string | null
          bio_en: string | null
          contact_button_link: string | null
          contact_button_text: string | null
          facebook_active: boolean | null
          facebook_url: string | null
          id: string
          instagram_active: boolean | null
          instagram_url: string | null
          is_active: boolean | null
          name: string | null
          profile_image_url: string | null
          show_blue_tick: boolean | null
          telegram_active: boolean | null
          telegram_url: string | null
          updated_at: string | null
          whatsapp_active: boolean | null
          whatsapp_number: string | null
          youtube_active: boolean | null
          youtube_url: string | null
        }
        Insert: {
          bio?: string | null
          bio_en?: string | null
          contact_button_link?: string | null
          contact_button_text?: string | null
          facebook_active?: boolean | null
          facebook_url?: string | null
          id?: string
          instagram_active?: boolean | null
          instagram_url?: string | null
          is_active?: boolean | null
          name?: string | null
          profile_image_url?: string | null
          show_blue_tick?: boolean | null
          telegram_active?: boolean | null
          telegram_url?: string | null
          updated_at?: string | null
          whatsapp_active?: boolean | null
          whatsapp_number?: string | null
          youtube_active?: boolean | null
          youtube_url?: string | null
        }
        Update: {
          bio?: string | null
          bio_en?: string | null
          contact_button_link?: string | null
          contact_button_text?: string | null
          facebook_active?: boolean | null
          facebook_url?: string | null
          id?: string
          instagram_active?: boolean | null
          instagram_url?: string | null
          is_active?: boolean | null
          name?: string | null
          profile_image_url?: string | null
          show_blue_tick?: boolean | null
          telegram_active?: boolean | null
          telegram_url?: string | null
          updated_at?: string | null
          whatsapp_active?: boolean | null
          whatsapp_number?: string | null
          youtube_active?: boolean | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_key: string
          updated_at: string | null
          variables: string | null
        }
        Insert: {
          body: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_key: string
          updated_at?: string | null
          variables?: string | null
        }
        Update: {
          body?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_key?: string
          updated_at?: string | null
          variables?: string | null
        }
        Relationships: []
      }
      faq_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          name_en: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          name_en?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          name_en?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          answer_en: string | null
          category_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
          question_en: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          answer: string
          answer_en?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
          question_en?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          answer?: string
          answer_en?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
          question_en?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "faq_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          id: string
          is_active: boolean | null
          section_key: string
          section_name: string
          settings: Json | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          section_key: string
          section_name: string
          settings?: Json | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          section_key?: string
          section_name?: string
          settings?: Json | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          subscribed_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          message_en: string | null
          title: string
          title_en: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          message_en?: string | null
          title: string
          title_en?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          message_en?: string | null
          title?: string
          title_en?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_banner_timer: {
        Row: {
          created_at: string | null
          end_message: string | null
          end_message_en: string | null
          end_time: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_message?: string | null
          end_message_en?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_message?: string | null
          end_message_en?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      offer_slides: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          affiliate_commission: number | null
          affiliate_id: string | null
          commission_amount: number | null
          commission_rate: number | null
          coupon_code: string | null
          created_at: string | null
          customer_email: string
          customer_input: string | null
          customer_name: string
          customer_phone: string | null
          delivery_content: string | null
          delivery_status: string | null
          discount_amount: number | null
          id: string
          is_reviewed: boolean | null
          offer_price: number | null
          order_number: string
          payment_method: string
          payment_type: string
          product_id: string | null
          product_title: string
          quantity: number | null
          regular_price: number | null
          rejection_reason: string | null
          seller_earning: number | null
          seller_id: string | null
          status: string | null
          total_price: number
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
          variant_id: string | null
          variant_label: string | null
        }
        Insert: {
          affiliate_commission?: number | null
          affiliate_id?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          coupon_code?: string | null
          created_at?: string | null
          customer_email: string
          customer_input?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_content?: string | null
          delivery_status?: string | null
          discount_amount?: number | null
          id?: string
          is_reviewed?: boolean | null
          offer_price?: number | null
          order_number: string
          payment_method: string
          payment_type: string
          product_id?: string | null
          product_title: string
          quantity?: number | null
          regular_price?: number | null
          rejection_reason?: string | null
          seller_earning?: number | null
          seller_id?: string | null
          status?: string | null
          total_price: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
          variant_label?: string | null
        }
        Update: {
          affiliate_commission?: number | null
          affiliate_id?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          coupon_code?: string | null
          created_at?: string | null
          customer_email?: string
          customer_input?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_content?: string | null
          delivery_status?: string | null
          discount_amount?: number | null
          id?: string
          is_reviewed?: boolean | null
          offer_price?: number | null
          order_number?: string
          payment_method?: string
          payment_type?: string
          product_id?: string | null
          product_title?: string
          quantity?: number | null
          regular_price?: number | null
          rejection_reason?: string | null
          seller_earning?: number | null
          seller_id?: string | null
          status?: string | null
          total_price?: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: string | null
          content_en: string | null
          id: string
          is_active: boolean | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          title_en: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_en?: string | null
          id?: string
          is_active?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          title_en?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_en?: string | null
          id?: string
          is_active?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          title_en?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_number: string | null
          account_type: string | null
          api_key: string | null
          created_at: string | null
          has_automatic: boolean | null
          id: string
          instructions: string | null
          instructions_en: string | null
          is_automatic_active: boolean | null
          is_manual_active: boolean | null
          name: string
          name_en: string | null
          send_type: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          api_key?: string | null
          created_at?: string | null
          has_automatic?: boolean | null
          id?: string
          instructions?: string | null
          instructions_en?: string | null
          is_automatic_active?: boolean | null
          is_manual_active?: boolean | null
          name: string
          name_en?: string | null
          send_type?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          api_key?: string | null
          created_at?: string | null
          has_automatic?: boolean | null
          id?: string
          instructions?: string | null
          instructions_en?: string | null
          is_automatic_active?: boolean | null
          is_manual_active?: boolean | null
          name?: string
          name_en?: string | null
          send_type?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      popup_settings: {
        Row: {
          button_link: string | null
          button_text: string | null
          button_text_en: string | null
          coupon_code: string | null
          heading: string | null
          heading_en: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          repeat_after_days: number | null
          show_delay_seconds: number | null
          show_on: string | null
          show_timer: boolean | null
          sub_text: string | null
          sub_text_en: string | null
          timer_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          button_text_en?: string | null
          coupon_code?: string | null
          heading?: string | null
          heading_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          repeat_after_days?: number | null
          show_delay_seconds?: number | null
          show_on?: string | null
          show_timer?: boolean | null
          sub_text?: string | null
          sub_text_en?: string | null
          timer_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          button_text_en?: string | null
          coupon_code?: string | null
          heading?: string | null
          heading_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          repeat_after_days?: number | null
          show_delay_seconds?: number | null
          show_on?: string | null
          show_timer?: boolean | null
          sub_text?: string | null
          sub_text_en?: string | null
          timer_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_accounts: {
        Row: {
          created_at: string | null
          extra_info: string | null
          id: string
          is_sold: boolean | null
          order_id: string | null
          password: string | null
          product_id: string | null
          sold_at: string | null
          username: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          extra_info?: string | null
          id?: string
          is_sold?: boolean | null
          order_id?: string | null
          password?: string | null
          product_id?: string | null
          sold_at?: string | null
          username?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          extra_info?: string | null
          id?: string
          is_sold?: boolean | null
          order_id?: string | null
          password?: string | null
          product_id?: string | null
          sold_at?: string | null
          username?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_accounts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_accounts_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_main: boolean | null
          product_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_main?: boolean | null
          product_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_main?: boolean | null
          product_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          label_en: string | null
          offer_price: number | null
          product_id: string | null
          regular_price: number
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          label_en?: string | null
          offer_price?: number | null
          product_id?: string | null
          regular_price: number
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          label_en?: string | null
          offer_price?: number | null
          product_id?: string | null
          regular_price?: number
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_view_logs: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          product_id: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          product_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          product_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_view_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_view_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          average_rating: number | null
          category_id: string | null
          created_at: string | null
          delivery_content: string | null
          delivery_type: string
          id: string
          is_active: boolean | null
          is_best_seller: boolean | null
          is_featured: boolean | null
          is_new_arrival: boolean | null
          is_variant: boolean | null
          long_description: string | null
          long_description_en: string | null
          offer_price: number | null
          regular_price: number | null
          rejection_reason: string | null
          seller_id: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          short_description_en: string | null
          slug: string
          status: string | null
          subscription_input_label: string | null
          subscription_input_label_en: string | null
          title: string
          title_en: string | null
          total_reviews: number | null
          total_sales: number | null
          updated_at: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          average_rating?: number | null
          category_id?: string | null
          created_at?: string | null
          delivery_content?: string | null
          delivery_type: string
          id?: string
          is_active?: boolean | null
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          is_variant?: boolean | null
          long_description?: string | null
          long_description_en?: string | null
          offer_price?: number | null
          regular_price?: number | null
          rejection_reason?: string | null
          seller_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          short_description_en?: string | null
          slug: string
          status?: string | null
          subscription_input_label?: string | null
          subscription_input_label_en?: string | null
          title: string
          title_en?: string | null
          total_reviews?: number | null
          total_sales?: number | null
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          average_rating?: number | null
          category_id?: string | null
          created_at?: string | null
          delivery_content?: string | null
          delivery_type?: string
          id?: string
          is_active?: boolean | null
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          is_variant?: boolean | null
          long_description?: string | null
          long_description_en?: string | null
          offer_price?: number | null
          regular_price?: number | null
          rejection_reason?: string | null
          seller_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          short_description_en?: string | null
          slug?: string
          status?: string | null
          subscription_input_label?: string | null
          subscription_input_label_en?: string | null
          title?: string
          title_en?: string | null
          total_reviews?: number | null
          total_sales?: number | null
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      pwa_notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          sent_at: string | null
          sent_to: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          sent_at?: string | null
          sent_to?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          sent_at?: string | null
          sent_to?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      recently_viewed: {
        Row: {
          id: string
          product_id: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recently_viewed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      review_slides: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          sort_order?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          order_id: string | null
          product_id: string | null
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_applications: {
        Row: {
          created_at: string | null
          email: string
          id: string
          phone: string
          product_types: string | null
          rejection_reason: string | null
          status: string | null
          store_description: string | null
          store_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          phone: string
          product_types?: string | null
          rejection_reason?: string | null
          status?: string | null
          store_description?: string | null
          store_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          phone?: string
          product_types?: string | null
          rejection_reason?: string | null
          status?: string | null
          store_description?: string | null
          store_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_withdrawals: {
        Row: {
          account_number: string
          amount: number
          created_at: string | null
          id: string
          payment_method: string
          processed_at: string | null
          rejection_reason: string | null
          seller_id: string | null
          status: string | null
        }
        Insert: {
          account_number: string
          amount: number
          created_at?: string | null
          id?: string
          payment_method: string
          processed_at?: string | null
          rejection_reason?: string | null
          seller_id?: string | null
          status?: string | null
        }
        Update: {
          account_number?: string
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: string
          processed_at?: string | null
          rejection_reason?: string | null
          seller_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_withdrawals_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          balance: number | null
          commission_rate: number | null
          created_at: string | null
          id: string
          rejection_reason: string | null
          status: string | null
          store_cover_url: string | null
          store_description: string | null
          store_logo_url: string | null
          store_name: string
          total_earnings: number | null
          total_withdrawn: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string | null
          store_cover_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name: string
          total_earnings?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string | null
          store_cover_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string
          total_earnings?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          group_name: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          group_name?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          group_name?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string | null
          id: string
          status: string | null
          subject: string
          ticket_number: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          status?: string | null
          subject: string
          ticket_number: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          status?: string | null
          subject?: string
          ticket_number?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_admin_reply: boolean | null
          message: string
          sender_id: string | null
          ticket_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_admin_reply?: boolean | null
          message: string
          sender_id?: string | null
          ticket_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_admin_reply?: boolean | null
          message?: string
          sender_id?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
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
      users: {
        Row: {
          avatar_url: string | null
          cover_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_banned: boolean | null
          phone: string | null
          preferred_language: string | null
          preferred_theme: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_banned?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          preferred_theme?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          preferred_theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      app_role:
        | "admin"
        | "seller"
        | "affiliate"
        | "customer"
        | "super_admin"
        | "moderator"
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
      app_role: [
        "admin",
        "seller",
        "affiliate",
        "customer",
        "super_admin",
        "moderator",
      ],
    },
  },
} as const
