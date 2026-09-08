export type CallStatus =
  | "idle"
  | "ringing"
  | "team_invite"
  | "accepted"
  | "declined"
  | "ended"
  | "missed";

export type PlatformVideoCallProps = {
  /** company: botão Chamar | professional: escuta chamadas entrantes */
  role: "company" | "professional";
  /** Obrigatório no papel company */
  profileId?: string;
  title?: string;
  compact?: boolean;
  peerLabel?: string;
};

export type ApiCall = {
  id: string;
  profileId: string;
  companyUserId: string;
  companyName: string;
  status: string;
};

export type Participant = {
  id: string;
  name: string;
};

export type RhMember = {
  id: string;
  name: string;
  email: string;
  department: string;
};
