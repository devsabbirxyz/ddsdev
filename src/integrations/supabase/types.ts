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
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          reason: string | null
          rejection_reason: string | null
          social_links: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone: string
          reason?: string | null
          rejection_reason?: string | null
          social_links?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          reason?: string | null
          rejection_reason?: string | null
          social_links?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_amount: number
          created_at: string
          id: string
          order_id: string | null
          status: string
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          status?: string
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
        ]
      }
      affiliate_withdrawals: {
        Row: {
          account_number: string
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          payment_method: string
          processed_at: string | null
          rejection_reason: string | null
          status: string
        }
        Insert: {
          account_number: string
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          payment_method: string
          processed_at?: string | null
          rejection_reason?: string | null
          status?: string
        }
        Update: {
          account_number?: string
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          processed_at?: string | null
          rejection_reason?: string | null
          status?: string
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
          balance: number
          commission_rate: number
          created_at: string
          id: string
          referral_code: string
          status: string
          total_earnings: number
          total_referrals: number
          total_withdrawn: number
          user_id: string
        }
        Insert: {
          balance?: number
          commission_rate?: number
          created_at?: string
          id?: string
          referral_code: string
          status?: string
          total_earnings?: number
          total_referrals?: number
          total_withdrawn?: number
          user_id: string
        }
        Update: {
          balance?: number
          commission_rate?: number
          created_at?: string
          id?: string
          referral_code?: string
          status?: string
          total_earnings?: number
          total_referrals?: number
          total_withdrawn?: number
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          content: string | null
          content_en: string | null
          created_at: string
          id: string
          is_featured: boolean
          is_published: boolean
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
          view_count: number
        }
        Insert: {
          content?: string | null
          content_en?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
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
          view_count?: number
        }
        Update: {
          content?: string | null
          content_en?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
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
          view_count?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          created_at: string
          discount_amount: number
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          user_id?: string
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
        ]
      }
      coupons: {
        Row: {
          applies_to: string
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          max_uses_per_user: number | null
          minimum_order: number
          start_date: string | null
          used_count: number
        }
        Insert: {
          applies_to?: string
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_user?: number | null
          minimum_order?: number
          start_date?: string | null
          used_count?: number
        }
        Update: {
          applies_to?: string
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_user?: number | null
          minimum_order?: number
          start_date?: string | null
          used_count?: number
        }
        Relationships: []
      }
      faq_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          name_en: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_en?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_en?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          answer_en: string | null
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean
          question: string
          question_en: string | null
          sort_order: number
        }
        Insert: {
          answer: string
          answer_en?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          question_en?: string | null
          sort_order?: number
        }
        Update: {
          answer?: string
          answer_en?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          question_en?: string | null
          sort_order?: number
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
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_banner_timer: {
        Row: {
          end_message: string | null
          end_message_en: string | null
          end_time: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          end_message?: string | null
          end_message_en?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          end_message?: string | null
          end_message_en?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      offer_slides: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
          title: string
          title_en: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title: string
          title_en?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title?: string
          title_en?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          customer_email: string
          customer_input: string | null
          customer_name: string
          customer_phone: string
          delivery_content: string | null
          delivery_status: string
          discount_amount: number
          id: string
          is_reviewed: boolean
          offer_price: number | null
          order_number: string
          payment_method: string
          payment_type: string | null
          product_id: string | null
          product_title: string | null
          quantity: number
          regular_price: number | null
          rejection_reason: string | null
          seller_earning: number
          seller_id: string | null
          status: string
          total_price: number
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
          variant_id: string | null
          variant_label: string | null
          wallet_points_earned: number | null
          wallet_points_used: number
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          customer_email: string
          customer_input?: string | null
          customer_name: string
          customer_phone: string
          delivery_content?: string | null
          delivery_status?: string
          discount_amount?: number
          id?: string
          is_reviewed?: boolean
          offer_price?: number | null
          order_number: string
          payment_method: string
          payment_type?: string | null
          product_id?: string | null
          product_title?: string | null
          quantity?: number
          regular_price?: number | null
          rejection_reason?: string | null
          seller_earning?: number
          seller_id?: string | null
          status?: string
          total_price: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
          variant_label?: string | null
          wallet_points_earned?: number | null
          wallet_points_used?: number
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          customer_email?: string
          customer_input?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_content?: string | null
          delivery_status?: string
          discount_amount?: number
          id?: string
          is_reviewed?: boolean
          offer_price?: number | null
          order_number?: string
          payment_method?: string
          payment_type?: string | null
          product_id?: string | null
          product_title?: string | null
          quantity?: number
          regular_price?: number | null
          rejection_reason?: string | null
          seller_earning?: number
          seller_id?: string | null
          status?: string
          total_price?: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
          variant_label?: string | null
          wallet_points_earned?: number | null
          wallet_points_used?: number
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
          created_at: string
          id: string
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
          created_at?: string
          id?: string
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
          created_at?: string
          id?: string
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
          created_at: string
          has_automatic: boolean
          id: string
          instructions: string | null
          instructions_en: string | null
          is_automatic_active: boolean
          is_manual_active: boolean
          name: string
          name_en: string | null
          send_type: string | null
          sort_order: number
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          api_key?: string | null
          created_at?: string
          has_automatic?: boolean
          id?: string
          instructions?: string | null
          instructions_en?: string | null
          is_automatic_active?: boolean
          is_manual_active?: boolean
          name: string
          name_en?: string | null
          send_type?: string | null
          sort_order?: number
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          api_key?: string | null
          created_at?: string
          has_automatic?: boolean
          id?: string
          instructions?: string | null
          instructions_en?: string | null
          is_automatic_active?: boolean
          is_manual_active?: boolean
          name?: string
          name_en?: string | null
          send_type?: string | null
          sort_order?: number
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
          is_active: boolean
          repeat_after_days: number
          show_delay_seconds: number
          show_on: string
          show_timer: boolean
          sub_text: string | null
          sub_text_en: string | null
          timer_minutes: number
          updated_at: string
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
          is_active?: boolean
          repeat_after_days?: number
          show_delay_seconds?: number
          show_on?: string
          show_timer?: boolean
          sub_text?: string | null
          sub_text_en?: string | null
          timer_minutes?: number
          updated_at?: string
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
          is_active?: boolean
          repeat_after_days?: number
          show_delay_seconds?: number
          show_on?: string
          show_timer?: boolean
          sub_text?: string | null
          sub_text_en?: string | null
          timer_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_accounts: {
        Row: {
          created_at: string
          extra_info: string | null
          id: string
          is_sold: boolean
          order_id: string | null
          password: string | null
          product_id: string
          sold_at: string | null
          username: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          extra_info?: string | null
          id?: string
          is_sold?: boolean
          order_id?: string | null
          password?: string | null
          product_id: string
          sold_at?: string | null
          username?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          extra_info?: string | null
          id?: string
          is_sold?: boolean
          order_id?: string | null
          password?: string | null
          product_id?: string
          sold_at?: string | null
          username?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_accounts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
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
          created_at: string
          id: string
          image_url: string
          is_main: boolean
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_main?: boolean
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_main?: boolean
          product_id?: string
          sort_order?: number
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
          created_at: string
          id: string
          is_active: boolean
          label: string
          label_en: string | null
          offer_price: number | null
          product_id: string
          regular_price: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          label_en?: string | null
          offer_price?: number | null
          product_id: string
          regular_price: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          label_en?: string | null
          offer_price?: number | null
          product_id?: string
          regular_price?: number
          sort_order?: number
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
          created_at: string
          id: string
          product_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
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
        ]
      }
      products: {
        Row: {
          average_rating: number
          category_id: string | null
          created_at: string
          delivery_content: string | null
          delivery_type: string
          id: string
          is_active: boolean
          is_best_seller: boolean
          is_featured: boolean
          is_new_arrival: boolean
          is_variant: boolean
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
          status: string
          subscription_input_label: string | null
          subscription_input_label_en: string | null
          title: string
          title_en: string | null
          total_reviews: number
          total_sales: number
          updated_at: string | null
          video_url: string | null
          view_count: number
        }
        Insert: {
          average_rating?: number
          category_id?: string | null
          created_at?: string
          delivery_content?: string | null
          delivery_type: string
          id?: string
          is_active?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_variant?: boolean
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
          status?: string
          subscription_input_label?: string | null
          subscription_input_label_en?: string | null
          title: string
          title_en?: string | null
          total_reviews?: number
          total_sales?: number
          updated_at?: string | null
          video_url?: string | null
          view_count?: number
        }
        Update: {
          average_rating?: number
          category_id?: string | null
          created_at?: string
          delivery_content?: string | null
          delivery_type?: string
          id?: string
          is_active?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_variant?: boolean
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
          status?: string
          subscription_input_label?: string | null
          subscription_input_label_en?: string | null
          title?: string
          title_en?: string | null
          total_reviews?: number
          total_sales?: number
          updated_at?: string | null
          video_url?: string | null
          view_count?: number
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
      review_slides: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          order_id: string
          product_id: string
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          order_id: string
          product_id: string
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          order_id?: string
          product_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
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
        ]
      }
      seller_applications: {
        Row: {
          created_at: string
          email: string
          id: string
          phone: string
          product_types: string | null
          rejection_reason: string | null
          status: string
          store_description: string | null
          store_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          phone: string
          product_types?: string | null
          rejection_reason?: string | null
          status?: string
          store_description?: string | null
          store_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          phone?: string
          product_types?: string | null
          rejection_reason?: string | null
          status?: string
          store_description?: string | null
          store_name?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_withdrawals: {
        Row: {
          account_number: string
          amount: number
          created_at: string
          id: string
          payment_method: string
          processed_at: string | null
          rejection_reason: string | null
          seller_id: string
          status: string
        }
        Insert: {
          account_number: string
          amount: number
          created_at?: string
          id?: string
          payment_method: string
          processed_at?: string | null
          rejection_reason?: string | null
          seller_id: string
          status?: string
        }
        Update: {
          account_number?: string
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          processed_at?: string | null
          rejection_reason?: string | null
          seller_id?: string
          status?: string
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
          balance: number
          commission_rate: number
          created_at: string
          id: string
          status: string
          store_cover_url: string | null
          store_description: string | null
          store_logo_url: string | null
          store_name: string
          total_earnings: number
          total_withdrawn: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          commission_rate?: number
          created_at?: string
          id?: string
          status?: string
          store_cover_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name: string
          total_earnings?: number
          total_withdrawn?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          commission_rate?: number
          created_at?: string
          id?: string
          status?: string
          store_cover_url?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string
          total_earnings?: number
          total_withdrawn?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          group_name: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          group_name?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          group_name?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin_reply: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
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
          is_active: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_banned: boolean
          phone: string | null
          updated_at: string | null
          wallet_points: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_banned?: boolean
          phone?: string | null
          updated_at?: string | null
          wallet_points?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_banned?: boolean
          phone?: string | null
          updated_at?: string | null
          wallet_points?: number
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          points: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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
