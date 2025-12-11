export interface TreeNode {
  color: string;
  name: string;
  value: number;
  summary?: string;
  url?: string;
  children?: Array<TreeNode>;
}
