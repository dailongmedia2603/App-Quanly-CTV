export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ai_error_logs: {
        Row: {
          id: string
          user_id: string | null
          error_message: string | null
          function_name: string | null
          context: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          error_message?: string | null
          function_name?: string | null
          context?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          error_message?: string | null
          function_name?: string | null
          context?: Json | null
          created_at?: string | null
        }
      }
      ai_generation_logs: {
        Row: {
          id: string
          user_id: string | null
          template_type: string
          final_prompt: string | null
          generated_content: string | null
          created_at: string | null
          is_hidden_in_admin_history: boolean | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          template_type: string
          final_prompt?: string | null
          generated_content?: string | null
          created_at?: string | null
          is_hidden_in_admin_history?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string | null
          template_type?: string
          final_prompt?: string | null
          generated_content?: string | null
          created_at?: string | null
          is_hidden_in_admin_history?: boolean | null
        }
      }
      ai_prompt_templates: {
        Row: {
          id: string
          template_type: string
          prompt: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          template_type: string
          prompt?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          template_type?: string
          prompt?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      api_key_usage: {
        Row: {
          service: string
          last_used_index: number
          updated_at: string | null
        }
        Insert: {
          service: string
          last_used_index: number
          updated_at?: string | null
        }
        Update: {
          service?: string
          last_used_index?: number
          updated_at?: string | null
        }
      }
      app_settings: {
        Row: {
          id: number
          support_widget_icon: string | null
          support_widget_title: string | null
          support_widget_description: string | null
          support_widget_link: string | null
          created_at: string | null
          page_title: string | null
          ai_model_name: string | null
          facebook_api_url: string | null
          facebook_api_token: string | null
          quote_company_name: string | null
          quote_company_address: string | null
          quote_company_email: string | null
          quote_company_phone: string | null
          quote_logo_url: string | null
          multiappai_api_url: string | null
          multiappai_api_key: string | null
          user_facebook_api_url: string | null
          user_facebook_api_key: string | null
          user_facebook_api_proxies: Json | null
        }
        Insert: {
          id: number
          support_widget_icon?: string | null
          support_widget_title?: string | null
          support_widget_description?: string | null
          support_widget_link?: string | null
          created_at?: string | null
          page_title?: string | null
          ai_model_name?: string | null
          facebook_api_url?: string | null
          facebook_api_token?: string | null
          quote_company_name?: string | null
          quote_company_address?: string | null
          quote_company_email?: string | null
          quote_company_phone?: string | null
          quote_logo_url?: string | null
          multiappai_api_url?: string | null
          multiappai_api_key?: string | null
          user_facebook_api_url?: string | null
          user_facebook_api_key?: string | null
          user_facebook_api_proxies?: Json | null
        }
        Update: {
          id?: number
          support_widget_icon?: string | null
          support_widget_title?: string | null
          support_widget_description?: string | null
          support_widget_link?: string | null
          created_at?: string | null
          page_title?: string | null
          ai_model_name?: string | null
          facebook_api_url?: string | null
          facebook_api_token?: string | null
          quote_company_name?: string | null
          quote_company_address?: string | null
          quote_company_email?: string | null
          quote_company_phone?: string | null
          quote_logo_url?: string | null
          multiappai_api_url?: string | null
          multiappai_api_key?: string | null
          user_facebook_api_url?: string | null
          user_facebook_api_key?: string | null
          user_facebook_api_proxies?: Json | null
        }
      }
      Bao_cao_Facebook: {
        Row: {
          id: string
          campaign_id: string | null
          user_id: string | null
          content: string | null
          posted_at: string | null
          keywords_found: string[] | null
          ai_evaluation: string | null
          sentiment: string | null
          source_url: string | null
          scanned_at: string | null
          suggested_comment: string | null
          source_post_id: string | null
          identified_service_id: string | null
        }
        Insert: {
          id?: string
          campaign_id?: string | null
          user_id?: string | null
          content?: string | null
          posted_at?: string | null
          keywords_found?: string[] | null
          ai_evaluation?: string | null
          sentiment?: string | null
          source_url?: string | null
          scanned_at?: string | null
          suggested_comment?: string | null
          source_post_id?: string | null
          identified_service_id?: string | null
        }
        Update: {
          id?: string
          campaign_id?: string | null
          user_id?: string | null
          content?: string | null
          posted_at?: string | null
          keywords_found?: string[] | null
          ai_evaluation?: string | null
          sentiment?: string | null
          source_url?: string | null
          scanned_at?: string | null
          suggested_comment?: string | null
          source_post_id?: string | null
          identified_service_id?: string | null
        }
      }
      consulting_messages: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          content?: string | null
          created_at?: string | null
        }
      }
      consulting_sessions: {
        Row: {
          id: string
          user_id: string
          service_id: string | null
          title: string
          created_at: string | null
          customer_salutation: string
          service_ids: string[] | null
        }
        Insert: {
          id?: string
          user_id: string
          service_id?: string | null
          title: string
          created_at?: string | null
          customer_salutation?: string
          service_ids?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string
          service_id?: string | null
          title?: string
          created_at?: string | null
          customer_salutation?: string
          service_ids?: string[] | null
        }
      }
      contract_payments: {
        Row: {
          id: string
          contract_id: string
          user_id: string | null
          amount: number
          payment_date: string
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          contract_id: string
          user_id?: string | null
          amount: number
          payment_date?: string
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          contract_id?: string
          user_id?: string | null
          amount?: number
          payment_date?: string
          notes?: string | null
          created_at?: string | null
        }
      }
      contracts: {
        Row: {
          id: string
          user_id: string
          project_name: string
          contract_value: number
          commission_rate: number
          status: string
          commission_paid: boolean
          start_date: string
          end_date: string | null
          created_at: string | null
          contract_link: string | null
        }
        Insert: {
          id?: string
          user_id: string
          project_name: string
          contract_value: number
          commission_rate?: number
          status?: string
          commission_paid?: boolean
          start_date: string
          end_date?: string | null
          created_at?: string | null
          contract_link?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          project_name?: string
          contract_value?: number
          commission_rate?: number
          status?: string
          commission_paid?: boolean
          start_date?: string
          end_date?: string | null
          created_at?: string | null
          contract_link?: string | null
        }
      }
      customer_finder_group_categories: {
        Row: {
          id: string
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
        }
      }
      customer_finder_groups: {
        Row: {
          id: string
          category_id: string | null
          name: string
          link: string
          created_at: string | null
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          link: string
          created_at?: string | null
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          link?: string
          created_at?: string | null
        }
      }
      customer_finding_guides: {
        Row: {
          id: string
          title: string
          description: string | null
          youtube_url: string
          thumbnail_url: string | null
          position: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          youtube_url: string
          thumbnail_url?: string | null
          position?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          youtube_url?: string
          thumbnail_url?: string | null
          position?: number | null
          created_at?: string | null
        }
      }
      danh_sach_chien_dich: {
        Row: {
          id: string
          user_id: string | null
          name: string
          type: string
          sources: string[]
          end_date: string | null
          scan_frequency: number
          scan_unit: string
          status: string | null
          scan_start_date: string | null
          keywords: string | null
          ai_filter_enabled: boolean | null
          ai_prompt: string | null
          next_scan_at: string | null
          website_scan_type: string | null
          created_at: string | null
          audience_type: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          type: string
          sources: string[]
          end_date?: string | null
          scan_frequency: number
          scan_unit: string
          status?: string | null
          scan_start_date?: string | null
          keywords?: string | null
          ai_filter_enabled?: boolean | null
          ai_prompt?: string | null
          next_scan_at?: string | null
          website_scan_type?: string | null
          created_at?: string | null
          audience_type?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          type?: string
          sources?: string[]
          end_date?: string | null
          scan_frequency?: number
          scan_unit?: string
          status?: string | null
          scan_start_date?: string | null
          keywords?: string | null
          ai_filter_enabled?: boolean | null
          ai_prompt?: string | null
          next_scan_at?: string | null
          website_scan_type?: string | null
          created_at?: string | null
          audience_type?: string
        }
      }
      document_post_types: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string | null
          word_count: number | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string | null
          word_count?: number | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string | null
          word_count?: number | null
        }
      }
      document_services: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          content: string | null
          service_id: string | null
          post_type_id: string | null
          created_at: string | null
          updated_at: string | null
          ai_prompt: string | null
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          service_id?: string | null
          post_type_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          ai_prompt?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          service_id?: string | null
          post_type_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          ai_prompt?: string | null
        }
      }
      email_campaign_logs: {
        Row: {
          id: string
          campaign_id: string
          user_id: string | null
          contact_email: string
          status: string
          sent_at: string | null
          error_message: string | null
          created_at: string | null
          email_content_id: string | null
          opened_at: string | null
          clicked_at: string | null
          sent_html_content: string | null
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id?: string | null
          contact_email: string
          status: string
          sent_at?: string | null
          error_message?: string | null
          created_at?: string | null
          email_content_id?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          sent_html_content?: string | null
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string | null
          contact_email?: string
          status?: string
          sent_at?: string | null
          error_message?: string | null
          created_at?: string | null
          email_content_id?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          sent_html_content?: string | null
        }
      }
      email_campaigns: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email_list_id: string | null
          status: string | null
          created_at: string | null
          scheduled_at: string | null
          sent_at: string | null
          send_interval_value: number | null
          send_interval_unit: string | null
          last_sent_at: string | null
          email_content_ids: string[] | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email_list_id?: string | null
          status?: string | null
          created_at?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          send_interval_value?: number | null
          send_interval_unit?: string | null
          last_sent_at?: string | null
          email_content_ids?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email_list_id?: string | null
          status?: string | null
          created_at?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          send_interval_value?: number | null
          send_interval_unit?: string | null
          last_sent_at?: string | null
          email_content_ids?: string[] | null
        }
      }
      email_content_groups: {
        Row: {
          id: string
          user_id: string | null
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          created_at?: string | null
        }
      }
      email_contents: {
        Row: {
          id: string
          user_id: string | null
          service_id: string | null
          name: string
          subject: string | null
          body: string | null
          created_at: string | null
          group_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          service_id?: string | null
          name: string
          subject?: string | null
          body?: string | null
          created_at?: string | null
          group_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          service_id?: string | null
          name?: string
          subject?: string | null
          body?: string | null
          created_at?: string | null
          group_id?: string | null
        }
      }
      email_list_contacts: {
        Row: {
          id: string
          list_id: string
          user_id: string | null
          email: string
          first_name: string | null
          last_name: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          list_id: string
          user_id?: string | null
          email: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          list_id?: string
          user_id?: string | null
          email?: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string | null
        }
      }
      email_lists: {
        Row: {
          id: string
          user_id: string | null
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          created_at?: string | null
        }
      }
      facebook_group_categories: {
        Row: {
          id: string
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
        }
      }
      generated_quotes: {
        Row: {
          id: string
          user_id: string | null
          budget: number
          generated_content: string | null
          final_price: number | null
          created_at: string | null
          name: string | null
          service_ids: string[] | null
          includes_vat: boolean | null
          other_requirements: string | null
          implementation_time: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          budget: number
          generated_content?: string | null
          final_price?: number | null
          created_at?: string | null
          name?: string | null
          service_ids?: string[] | null
          includes_vat?: boolean | null
          other_requirements?: string | null
          implementation_time?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          budget?: number
          generated_content?: string | null
          final_price?: number | null
          created_at?: string | null
          name?: string | null
          service_ids?: string[] | null
          includes_vat?: boolean | null
          other_requirements?: string | null
          implementation_time?: string | null
        }
      }
      list_nguon_facebook: {
        Row: {
          id: string
          user_id: string | null
          group_name: string | null
          group_id: string | null
          origin: string | null
          created_at: string | null
          category_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          group_name?: string | null
          group_id?: string | null
          origin?: string | null
          created_at?: string | null
          category_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          group_name?: string | null
          group_id?: string | null
          origin?: string | null
          created_at?: string | null
          category_id?: string | null
        }
      }
      manual_action_logs: {
        Row: {
          id: string
          user_id: string | null
          action_type: string
          request_url: string | null
          request_body: Json | null
          response_status: number | null
          response_body: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action_type: string
          request_url?: string | null
          request_body?: Json | null
          response_status?: number | null
          response_body?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action_type?: string
          request_url?: string | null
          request_body?: Json | null
          response_status?: number | null
          response_body?: Json | null
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          updated_at: string | null
          bank_name: string | null
          bank_account_number: string | null
          bank_account_name: string | null
          momo: string | null
          google_refresh_token: string | null
          google_connected_email: string | null
          facebook_cookie: string | null
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          bank_name?: string | null
          bank_account_number?: string | null
          bank_account_name?: string | null
          momo?: string | null
          google_refresh_token?: string | null
          google_connected_email?: string | null
          facebook_cookie?: string | null
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          bank_name?: string | null
          bank_account_number?: string | null
          bank_account_name?: string | null
          momo?: string | null
          google_refresh_token?: string | null
          google_connected_email?: string | null
          facebook_cookie?: string | null
        }
      }
      quote_templates: {
        Row: {
          id: string
          name: string
          content: string
          created_at: string | null
          service_id: string | null
        }
        Insert: {
          id?: string
          name: string
          content: string
          created_at?: string | null
          service_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          content?: string
          created_at?: string | null
          service_id?: string | null
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          created_at: string | null
          description: string | null
          permissions: Json | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
          description?: string | null
          permissions?: Json | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
          description?: string | null
          permissions?: Json | null
        }
      }
      scan_logs: {
        Row: {
          id: string
          campaign_id: string | null
          user_id: string | null
          scan_time: string | null
          status: string | null
          message: string | null
          details: Json | null
          log_type: string | null
          source_type: string | null
        }
        Insert: {
          id?: string
          campaign_id?: string | null
          user_id?: string | null
          scan_time?: string | null
          status?: string | null
          message?: string | null
          details?: Json | null
          log_type?: string | null
          source_type?: string | null
        }
        Update: {
          id?: string
          campaign_id?: string | null
          user_id?: string | null
          scan_time?: string | null
          status?: string | null
          message?: string | null
          details?: Json | null
          log_type?: string | null
          source_type?: string | null
        }
      }
      service_categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          created_at?: string | null
        }
      }
      service_details: {
        Row: {
          id: string
          category_id: string | null
          name: string
          service_info_content: string | null
          pricing_content: string | null
          created_at: string | null
          pricing_image_urls: string[] | null
          position: number | null
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          service_info_content?: string | null
          pricing_content?: string | null
          created_at?: string | null
          pricing_image_urls?: string[] | null
          position?: number | null
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          service_info_content?: string | null
          pricing_content?: string | null
          created_at?: string | null
          pricing_image_urls?: string[] | null
          position?: number | null
        }
      }
      service_prices: {
        Row: {
          id: string
          name: string
          description: string | null
          unit: string | null
          price: number
          category: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          unit?: string | null
          price: number
          category?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          unit?: string | null
          price?: number
          category?: string | null
          created_at?: string | null
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role_id: string
        }
        Insert: {
          user_id: string
          role_id: string
        }
        Update: {
          user_id?: string
          role_id?: string
        }
      }
      user_suggested_comments: {
        Row: {
          user_id: string
          report_id: string
          comment_text: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          report_id: string
          comment_text?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          report_id?: string
          comment_text?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      video_guides: {
        Row: {
          id: string
          title: string
          description: string | null
          youtube_url: string
          position: number | null
          created_at: string | null
          thumbnail_url: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          youtube_url: string
          position?: number | null
          created_at?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          youtube_url?: string
          position?: number | null
          created_at?: string | null
          thumbnail_url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_email_list_with_contacts: {
        Args: {
          list_name: string
          contact_emails: string[]
        }
        Returns: string
      }
      get_all_facebook_posts_for_finder: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          campaign_id: string
          posted_at: string
          keywords_found: string[]
          ai_evaluation: string
          sentiment: string
          source_url: string
          scanned_at: string
          description: string
          suggested_comment: string
          identified_service_id: string
          source_post_id: string
        }[]
      }
      get_all_facebook_posts_for_internal_finder: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          campaign_id: string
          posted_at: string
          keywords_found: string[]
          ai_evaluation: string
          sentiment: string
          source_url: string
          scanned_at: string
          description: string
          suggested_comment: string
          identified_service_id: string
          source_post_id: string
        }[]
      }
      get_all_income_stats_for_month: {
        Args: {
          target_month: string
        }
        Returns: {
          user_id: string
          full_name: string
          email: string
          fixed_salary: number
          new_contract_commission: number
          old_contract_commission: number
          total_income: number
          contract_count: number
          actual_received: number
        }[]
      }
      get_income_stats_for_month: {
        Args: {
          target_month: string
          target_user_id?: string
        }
        Returns: {
          fixed_salary: number
          new_contract_commission: number
          old_contract_commission: number
          total_income: number
          contract_count: number
          actual_received: number
        }[]
      }
      get_monthly_revenue: {
        Args: {
          target_month: string
        }
        Returns: number
      }
      get_next_user_facebook_proxy: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_old_contracts_with_payments_in_month: {
        Args: {
          target_month: string
          target_user_id?: string
        }
        Returns: {
          contract_id: string
          project_name: string
          start_date: string
          amount_paid_in_month: number
          commission_rate: number
          commission_amount: number
        }[]
      }
      get_user_activity_stats: {
        Args: {
          start_date?: string
          end_date?: string
        }
        Returns: {
          user_id: string
          full_name: string
          email: string
          post_count: number
          comment_count: number
          consulting_session_count: number
          total_messages_count: number
          active_days_count: number
        }[]
      }
      get_user_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          role_name: string
        }[]
      }
      get_user_roles_with_permissions: {
        Args: Record<PropertyKey, never>
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
}