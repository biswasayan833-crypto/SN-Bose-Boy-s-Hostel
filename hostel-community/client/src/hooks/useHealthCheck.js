import { useState, useEffect } from 'react';
import { getHealthStatus } from '../services/healthService';

export const useHealthCheck = () => {
  const [status, setStatus] = useState({
    loading: true,
    online: false,
    data: null,
    error: null,
  });

  const check = async () => {
    try {
      const result = await getHealthStatus();
      setStatus({
        loading: false,
        online: true,
        data: result.data || result,
        error: null,
      });
    } catch (err) {
      setStatus({
        loading: false,
        online: false,
        data: null,
        error: err.message || 'Backend offline',
      });
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000); // 30s heartbeat
    return () => clearInterval(interval);
  }, []);

  return { ...status, refetch: check };
};

export default useHealthCheck;
