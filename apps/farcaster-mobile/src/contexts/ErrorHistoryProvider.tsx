import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

type ErrorWithMetadata = {
  error: Error;
  timestamp: number;
};

type ErrorHistoryContext = {
  errors: ErrorWithMetadata[];
  addError: (error: Error) => void;
  clearErrors: () => void;
};

const ErrorHistoryContext = createContext<ErrorHistoryContext>({
  errors: [],
  addError: () => undefined,
  clearErrors: () => undefined,
});

type ErrorHistoryProviderProps = { children: ReactNode };

const ErrorHistoryProvider: FC<ErrorHistoryProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorWithMetadata[]>([]);

  const addError = useCallback((error: Error) => {
    setErrors((prevErrors) =>
      [{ timestamp: Date.now(), error }, ...prevErrors].slice(0, 20),
    );
  }, []);

  const clearErrors = useCallback(() => setErrors([]), []);

  return (
    <ErrorHistoryContext.Provider value={{ errors, addError, clearErrors }}>
      {children}
    </ErrorHistoryContext.Provider>
  );
};

const useErrorHistory = () => useContext(ErrorHistoryContext);

export { ErrorHistoryProvider, useErrorHistory };
