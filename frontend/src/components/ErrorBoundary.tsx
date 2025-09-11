import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // 부모 컴포넌트에 에러 보고
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 개발 모드에서만 상세 로깅
    if (import.meta.env.DEV) {
      console.group('🔴 Error Boundary Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="ui-error-container" role="alert">
          <div className="ui-error-content">
            <span className="ui-error-icon" role="img" aria-label="오류">💥</span>
            <h2>문제가 발생했습니다</h2>
            <p>예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="ui-error-details">
                <summary>개발자 정보 (개발 모드에서만 표시)</summary>
                <pre className="ui-error-stack">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            <div className="ui-error-actions">
              <button 
                onClick={this.handleRetry}
                className="ui-btn ui-btn-secondary"
                type="button"
              >
                다시 시도
              </button>
              <button 
                onClick={this.handleReload}
                className="ui-btn ui-btn-primary"
                type="button"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}