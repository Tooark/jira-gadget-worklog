export type IconItem = {
  "16x16": string | null;
  "24x24": string | null;
  "32x32": string | null;
  "48x48": string | null;
};

export interface UserItem {
  accountId: string;
  accountType: string;
  displayName: string;
  timeZone?: string;
  avatarUrls: IconItem;
  active: boolean;
}

export interface WorklogsItems {
  author: UserItem;
  timeSpentSeconds: number;
  started: string;
}

export interface WorklogItem {
  startAt: number;
  maxResults: number;
  total: number;
  worklogs: WorklogsItems[];
}

export interface FieldItem {
  worklog: WorklogItem;
  summary?: string;
}

export interface IssueItem {
  id: string;
  key?: string;
  fields: FieldItem;
}

export interface IssueSearchResult {
  issues: IssueItem[];
  isLast: boolean;
  nextPageToken?: string;
}

export type TreeNode = {
  value: number;
  days?: Record<string, TreeNode>;
  issues?: Record<string, TreeNode>;
  summary?: string;
  url?: string;
};

export type OutputNode = {
  color: string;
  name: string;
  value: number;
  children: OutputNode[];
  summary?: string;
  url?: string;
};

export type WorklogPayload = {
  days: number;
  color: string;
  query: string;
  users: string[] | null;
};
