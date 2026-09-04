import type { FOCUS_TAGS, ProductType } from "./constants";

export type FocusTag = (typeof FOCUS_TAGS)[number];
export type RequestType = "feedback" | "tester" | "combo" | "language" | "play" | "testflight";
export type RequestStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "expired"
  | "cancelled";
export type ConfirmStatus = "pending" | "confirmed" | "rejected";
export type CommitmentStatus =
  | "active"
  | "completed"
  | "voided"
  | "cancelled";

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  credits: number;
  credits_pending: number;
  reviews_given: number;
  bugs_found?: number;
  rating_avg: number;
  rating_count: number;
  is_ramped: boolean;
  is_pro: boolean;
  daily_review_count: number;
  daily_review_date: string | null;
  purchased_credits: number;
  has_reviewed_once?: boolean;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
};

export type ShippedApp = {
  id: string;
  owner_id: string;
  app_name: string;
  app_url: string;
  launched_at: string;
  helper_ids: string[];
  created_at: string;
};

export type RequestRow = {
  id: string;
  user_id: string;
  type: RequestType;
  app_name: string;
  app_url: string;
  app_description: string;
  test_credentials_encrypted?: string | null;
  focus_tag: FocusTag | null;
  question_count: number;
  credit_cost: number;
  testers_needed: number;
  testers_filled: number;
  status: RequestStatus;
  bounty_multiplier: number;
  claimed_at: string | null;
  expires_at: string;
  created_at: string;
  opt_in_link: string | null;
  test_focus: string | null;
  test_start_date: string | null;
  is_demo?: boolean;
  platform?: string | null;
  product_type?: ProductType | string | null;
  duration_days?: number | null;
  boosted_until?: string | null;
  boost_offer_sent_at?: string | null;
};

export type Question = {
  id: string;
  request_id: string;
  position: number;
  text: string;
  is_core: boolean;
  is_proof: boolean;
};

export type Review = {
  id: string;
  request_id: string;
  reviewer_id: string;
  answers: Record<string, string>;
  proof_passed: boolean;
  time_spent_seconds: number;
  confirm_status: ConfirmStatus;
  rating_received: number | null;
  credits_awarded: number | null;
  sample_question_ids: string[];
  created_at: string;
  auto_confirm_at: string;
};

export type TesterCommitment = {
  id: string;
  request_id: string;
  tester_id: string;
  google_email: string;
  opted_in_at: string;
  checkins_completed: number;
  checkins_missed: number;
  checkin_days: boolean[];
  status: CommitmentStatus;
  completes_at: string;
  duration_days?: number;
  final_review_id: string | null;
  created_at: string;
};

export type CreditLedgerEntry = {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  ref_id: string | null;
  status: "pending" | "available" | "expired" | "voided";
  expires_at: string | null;
  available_at: string | null;
  created_at: string;
};

export type BoardRequest = RequestRow & {
  requester: Pick<Profile, "id" | "display_name" | "avatar_url" | "is_pro">;
  wait_hours: number;
};
