import { useCallback } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useNavigate } from 'react-router-dom';

const useGoBack = () => {
  const navigate = useNavigate();

  return useCallback(() => {
    // TODO: This won't work when we land to a page directly.
    // Figure out a way to determine if there is a location history first.
    navigate(-1);
  }, [navigate]);
};

export { useGoBack };
