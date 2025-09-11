import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Axios 인스턴스 생성
const client = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 - 모든 요청에 토큰 자동 첨부
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("auth:token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // 요청 로깅 (개발 환경에서만)
        if (import.meta.env.DEV) {
            console.log(`🚀 API 요청: ${config.method?.toUpperCase()} ${config.url}`, {
                data: config.data,
                params: config.params
            });
        }
        
        return config;
    },
    (error) => {
        console.error("API 요청 설정 오류:", error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터 - 401 에러 시 자동 로그아웃 및 에러 처리 개선
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
    (error) => {
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
            localStorage.removeItem("auth:token");
            localStorage.removeItem("auth:user");

            const currentPath = window.location.pathname;
            if (currentPath !== "/login" && currentPath !== "/signup") {
                const returnUrl = encodeURIComponent(currentPath);
                // replace 사용으로 뒤로가기 무한루프 방지
                window.location.replace(`/login?from=${returnUrl}`);
            }
        }

        return Promise.reject(error);
    }
);

export default client;