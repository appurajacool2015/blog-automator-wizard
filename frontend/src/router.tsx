import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import CategoryList from './components/CategoryList';
import ChannelList from './components/ChannelList';
import VideoList from './components/VideoList';
import VideoContent from './components/VideoContent';
import Index from './pages/Index';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: 'admin',
        element: <Admin />,
      },
      {
        path: 'category/:categoryId',
        element: <CategoryList />,
      },
      {
        path: 'channel/:channelId',
        element: <ChannelList />,
      },
      {
        path: 'video/:videoId',
        element: <VideoList />,
      },
      {
        path: 'video/:videoId/content',
        element: <VideoContent />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
], {
  future: {
    // @ts-ignore - These flags will be available in v7
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

export const Router = () => {
  return <RouterProvider router={router} />;
}; 