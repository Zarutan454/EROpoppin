import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Helmet } from 'react-helmet';
import { SnackbarProvider } from 'notistack';

import { store } from '@/store';
import { theme } from '@/styles/theme';
import Routes from '@/routes';
import Layout from '@/components/layout/Layout';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import LoadingScreen from '@/components/common/LoadingScreen';
import AuthProvider from '@/contexts/AuthContext';
import SocketProvider from '@/contexts/SocketContext';
import { useInitializeApp } from '@/hooks/useInitializeApp';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  const { isLoading, error } = useInitializeApp();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <div>Error initializing app: {error.message}</div>;
  }

  return (
    <ErrorBoundary>
      <Helmet
        titleTemplate="%s - VIP Escort Service"
        defaultTitle="VIP Escort Service"
      >
        <meta
          name="description"
          content="Premium VIP Escort Service - Diskrete und stilvolle Begleitung"
        />
        <meta name="theme-color" content={theme.palette.primary.main} />
      </Helmet>

      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ThemeProvider theme={theme}>
              <SnackbarProvider
                maxSnack={3}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <BrowserRouter>
                  <AuthProvider>
                    <SocketProvider>
                      <CssBaseline />
                      <Layout>
                        <Routes />
                      </Layout>
                    </SocketProvider>
                  </AuthProvider>
                </BrowserRouter>
              </SnackbarProvider>
            </ThemeProvider>
          </LocalizationProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;