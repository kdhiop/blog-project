import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 - 타입 안전성 개선
client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        try {
            const token = localStorage.getItem("auth:token");
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn("토큰 조회 실패 (localStorage 접근 불가):", error);
        }
        
        // 요청 로깅 (개발 환경에서만)
        if (import.meta.env.DEV) {
            console.log(`🚀 API 요청: ${config.method?.toUpperCase()} ${config.url}`, {
                data: config.data,
                params: config.params,
                headers: config.headers.Authorization ? 
                    { ...config.headers, Authorization: "[HIDDEN]" } : 
                    config.headers
            });
        }
        
        return config;
    },
    (error: AxiosError) => {
        console.error("API 요청 설정 오류:", error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터 - 에러 처리 개선
client.interceptors.response.use(
    (response) => {
        // 응답 로깅 (개발 환경에서만)
        if (import.meta.env.DEV) {
            console.log(`✅ API 응답: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                status: response.status,
                data: response.data
            });
        }
        
        return response;
    },
    (error: AxiosError) => {
        // 에러 로깅
        if (import.meta.env.DEV) {
            console.error(`❌ API 에러: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
        }

        // 401 에러 처리 (인증 만료)
        if (error.response?.status === 401) {
            try {
                localStorage.removeItem("auth:token");
                localStorage.removeItem("auth:user");
            } catch (storageError) {
                console.warn("localStorage 정리 실패:", storageError);
            }

            // 현재 경로가 인증 관련 페이지가 아닌 경우에만 리다이렉트
            const currentPath = window.location.pathname;
            const authPaths = ["/login", "/signup"];
            const isAuthPath = authPaths.some(path => currentPath.startsWith(path));
            
            if (!isAuthPath) {
                const returnUrl = encodeURIComponent(currentPath + window.location.search);
                window.location.replace(`/login?from=${returnUrl}`);
            }
        }

        // 네트워크 에러 처리
        if (!error.response) {
            if (error.code === 'ECONNABORTED') {
                console.error('요청 타임아웃 - 서버 응답이 느립니다');
            } else if (error.message === 'Network Error') {
                console.error('네트워크 연결 오류 - 인터넷 연결을 확인해주세요');
            } else {
                console.error('네트워크 오류:', error.message);
            }
        }

        return Promise.reject(error);
    }
);

export default client;