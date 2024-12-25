import { DEBUG_CONFIG, IS_DEV } from '../config/debug';

export const useDebugAuth = () => {
  const isEnabled = IS_DEV && DEBUG_CONFIG.AUTH.ENABLED;
  const shouldAutoLogin = isEnabled && DEBUG_CONFIG.AUTH.AUTO_LOGIN;
  const mockUser = DEBUG_CONFIG.AUTH.MOCK_USER;

  return {
    isEnabled,
    shouldAutoLogin,
    mockUser
  };
};