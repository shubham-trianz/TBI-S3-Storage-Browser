export interface Case {
    user_name: string,
    case_number: string,
    source_key: string,
    case_title: string,
    case_agents: string,
    jurisdiction: string[],
    email: string,
    size: number
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

export interface ShareCaseToPayload {
  // DynamoDB keys
  receiver_user_id: string;           // RECEIVER#<receiver_user_id>
  case_number: string;           // CASE#<case_number>

  gsi1pk: string;       // OWNER#<owner_user_id>
  gsi1sk: string;       // CASE#<case_number>#RECEIVER#<receiver_user_id>

  // Identifiers
  // case_number: string;
  owner_user: string;
  receiver_user: string;
  receiver_email: string;

  // Metadata snapshot
  case_title: string;
  jurisdiction?: string[];
  case_agents?: string;
  size?: number;
  source_key: string;
  owner_email?: string;

  // Permissions
  permissions: CasePermissions;

  // Audit
  shared_at: string;    // ISO timestamp
  updated_at?: string;  // ISO timestamp
        // epoch seconds (optional)
}

// export interface ShareCaseToPayload {
//   items: SharedCaseItem[];
// }

export interface ReceiveCasePayload {
  user_name: string
}




