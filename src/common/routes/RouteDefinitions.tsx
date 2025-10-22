import { type RouteDefinition, Routes } from './routes';
import Home from '../../features/home/Home';
import { NotFound } from '../components/NotFound';
import RiderPage from '../../features/rider/RiderPage';

export const RouteDefinitions : RouteDefinition[] = [
  {
    path: Routes.Home,
    element: <Home />
  },
  // Add more routes here
  // { path: Routes.Driver, element: <Driver /> },
  { path: Routes.Rider, element: <RiderPage /> },
  {
    path: '*',
    element: <NotFound />
  }
];