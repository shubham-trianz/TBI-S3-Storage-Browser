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

