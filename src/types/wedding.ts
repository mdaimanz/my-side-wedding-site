export type WeddingDetails = {
  couple: { partnerOne: string; partnerTwo: string };
  invitationFrom: string[];
  date: { iso: string; endIso: string; display: string; day: string; time: string };
  venue: { name: string; address: string; mapUrl: string };
  schedule: Array<{ time: string; title: string; description: string }>;
  contact: Array<{ name: string; phone: string; href: string }>;
};

export type GuestRecord = {
  id: number;
  name: string;
  phone_number: string;
  attendance: "attending" | "not_attending";
  guest_count: number;
  message: string | null;
  display_wish: boolean | 0 | 1;
  updated_at: Date;
};

export type WeddingWish = {
  full_name: string;
  wish: string;
};

