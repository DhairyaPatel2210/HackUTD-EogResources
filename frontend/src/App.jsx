import { AppRouter } from '@/components/router/AppRouter';
import { Spinner } from '@/components/ui/Spinner';

import './index.css';
import { useApp } from './hooks/useApp';

function App() {

  const { loading } = useApp();

  if (loading) {
    return <div className='flex flex-row justify-center items-center w-screen h-screen'>
      <Spinner />
    </div>;
  }

  return (
    <AppRouter />
  );
}

export default App;
