import { createRoot } from 'react-dom/client';
import '@/styles/global.css';
import '@mujian/js-sdk/lite';
import { ReactRouterProvider } from './providers/RouterProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <ReactRouterProvider />
);
