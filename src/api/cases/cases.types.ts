export interface Case {
    user_name: string,
    case_number: string,
    source_key: string,
    case_title: string,
    case_agents: string,
    jurisdiction: string[],
    shared_to: SharedTo[],
    email: string,
    size: number
}

export interface DeleteEvidencePayload {
  objectKeys: string[];
}
export interface SharedTo {
  email: string,
  permissions: Permissions,
  shared_at: string,
  user_id: string
}
export interface Permissions {
  read: boolean,
  write: boolean
}
export interface CreateCasePayload {
  user_name: string;
  email: string;
  case_number: string;
  case_title: string;
  case_agents: string;
  jurisdiction: string; 
  source_key: string;
}

export interface CasePermissions {
  read: boolean;
  write: boolean;
}

export interface ReceivedCase {
  userId: string,
  count: number,
  cases: ShareCaseToPayload[]
}

export interface ShareCaseToPayload {
  receiver_user_id: string;
  case_number: string;

  gsi1pk: string;       
  gsi1sk: string;      

  owner_user: string;
  receiver_user: string;
  receiver_email: string;

  case_title: string;
  jurisdiction?: string[];
  case_agents?: string;
  size?: number;
  source_key: string;
  owner_email?: string;

  permissions: CasePermissions;

  shared_at: string;    
  updated_at?: string;  
}

export interface ReceiveCasePayload {
  user_name: string
}

export interface ReceiveCasePayload {
  user_name: string
}

export interface EvidenceItem {
  evidence_number: string;
  description: string;
  source_key: string;
  uploaded_at: string;
}

export interface EvidenceListResponse {
  items: EvidenceItem[];
  nextCursor?: string | null;
}

export type ShareExternalPayload = {
  case_number: string;
  file: string;
  email: string;
  wrapped_url: string;

  case_title?: string;
  case_agents?: string;
  jurisdiction?: string[];
  owner: string;
  owner_email?: string;
  
  permissions: {
    read: boolean;
    write: boolean;
  };
  shared_at: string;
};