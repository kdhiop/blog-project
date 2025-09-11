import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Axios 인스턴스 생성
const client = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

// 요청 인터셉터 - 모든 요청에 토큰 자동 첨부
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("auth:token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 - 401 에러 시 자동 로그아웃
client.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // 토큰이 유효하지 않거나 만료됨
            localStorage.removeItem("auth:token");
            localStorage.removeItem("auth:user");

            // 현재 경로가 로그인/회원가입 페이지가 아닌 경우에만 리다이렉트
            const currentPath = window.location.pathname;
            if (currentPath !== "/login" && currentPath !== "/signup") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default client;