export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  email_list_id: string | null;
  status: string;
  created_at: string;
  scheduled_at: string | null;
  sent_at: string | null;
  send_interval_value: number | null;
  send_interval_unit: string | null;
  last_sent_at: string | null;
  email_content_ids: string[] | null;
}