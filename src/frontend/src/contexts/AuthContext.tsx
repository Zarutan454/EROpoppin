import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import { loginRequest, registerRequest, logoutRequest, getMeRequest } from '@/services/authService';
import { setAuthToken, removeAuthToken } from '@/utils/auth';
import { User } from '@/types/user';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'client' | 'escort';
}

export const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

// Action Types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

// Initial State
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        isAuthenticated: true,
        isLoading: false,
        user: action.payload,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Initialer Auth-Check
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          dispatch({ type: 'AUTH_FAILURE', payload: 'No token found' });
          return;
        }

        setAuthToken(token);
        const user = await getMeRequest();
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication failed' });
        removeAuthToken();
      }
    };

    initAuth();
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const { user, token } = await loginRequest(email, password);
      setAuthToken(token);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      enqueueSnackbar('Successfully logged in', { variant: 'success' });
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Login failed',
      });
      enqueueSnackbar('Login failed. Please try again.', { variant: 'error' });
    }
  }, [navigate, enqueueSnackbar]);

  // Register
  const register = useCallback(async (data: RegisterData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const { user, token } = await registerRequest(data);
      setAuthToken(token);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      enqueueSnackbar('Registration successful', { variant: 'success' });
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'Registration failed',
      });
      enqueueSnackbar('Registration failed. Please try again.', {
        variant: 'error',
      });
    }
  }, [navigate, enqueueSnackbar]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await logoutRequest();
      dispatch({ type: 'AUTH_LOGOUT' });
      removeAuthToken();
      navigate('/');
      enqueueSnackbar('Successfully logged out', { variant: 'success' });
    } catch (error) {
      console.error('Logout error:', error);
      enqueueSnackbar('Logout failed', { variant: 'error' });
    }
  }, [navigate, enqueueSnackbar]);

  // Update User
  const updateUser = useCallback((user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  // Memoized Context Value
  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      updateUser,
    }),
    [state, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;