export interface WindowConfig {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface TaskbarApp {
  id: string;
  title: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}