import type { ReactNode } from "react";

export enum Routes {
  Home = '/',
  Driver = '/driver',
  Rider = '/rider'
}

export const RoutesNameMap = new Map<string, string>([
  [Routes.Home, 'Choose Service Use Type']
]);

export type RouteDefinition = {
  path?: string;
  element: ReactNode;
  children?: RouteDefinition[];
};