export type WeddingDetails = {
  couple: { partnerOne: string; partnerTwo: string };
  invitationFrom: string[];
  date: { iso: string; display: string; day: string; time: string };
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
  updated_at: Date;
};

