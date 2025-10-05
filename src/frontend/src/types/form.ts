export interface FormValues {
  days: number;
  color: 'color' | 'gray' | 'red' | 'blue' | 'green' | 'orange';
  jql: string;
  users?: string[];
}
