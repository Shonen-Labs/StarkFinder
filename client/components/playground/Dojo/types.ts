import { ComponentType, SVGProps } from "react";

// Define a type for the icon component
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// Shared DojoBlock interface to be used across components
export interface DojoBlock {
  id: string;
  content: string;
  color: string;
  borderColor: string;
  hoverBorderColor: string;
  icon: IconComponent;
  code: string;
  // Additional fields from DojoBlocksSidebar's DojoBlock interface
  title?: string; // Making title optional
  description?: string;
}