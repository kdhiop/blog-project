// src/context/SecretAccessContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SecretAccessContextType {
  hasAccess: (postId: number) => boolean;
  grantAccess: (postId: number) => void;
  revokeAccess: (postId: number) => void;
  clearAllAccess: () => void;
}

const SecretAccessContext = createContext<SecretAccessContextType | undefined>(undefined);

export const SecretAccessProvider = ({ children }: { children: ReactNode }) => {
  // 메모리에만 저장 (세션 종료시 자동 삭제)
  const [accessiblePosts, setAccessiblePosts] = useState<Set<number>>(new Set());

  const hasAccess = useCallback((postId: number) => {
    return accessiblePosts.has(postId);
  }, [accessiblePosts]);

  const grantAccess = useCallback((postId: number) => {
    setAccessiblePosts(prev => new Set([...prev, postId]));
    console.log(`비밀글 접근 권한 부여: postId=${postId}`);
  }, []);

  const revokeAccess = useCallback((postId: number) => {
    setAccessiblePosts(prev => {
      const newSet = new Set(prev);
      newSet.delete(postId);
      return newSet;
    });
    console.log(`비밀글 접근 권한 회수: postId=${postId}`);
  }, []);

  const clearAllAccess = useCallback(() => {
    setAccessiblePosts(new Set());
    console.log('모든 비밀글 접근 권한 초기화');
  }, []);

  return (
    <SecretAccessContext.Provider value={{ hasAccess, grantAccess, revokeAccess, clearAllAccess }}>
      {children}
    </SecretAccessContext.Provider>
  );
};

export const useSecretAccess = () => {
  const context = useContext(SecretAccessContext);
  if (!context) {
    throw new Error('useSecretAccess must be used within SecretAccessProvider');
  }
  return context;
};