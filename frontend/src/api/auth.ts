import client from "./client";

export interface User {
    id: number;
    username: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export const register = async (payload: { username: string; password: string }): Promise<User> => {
    const res = await client.post<User>("/auth/register", payload);
    return res.data;
};

export const login = async (payload: { username: string; password: string }): Promise<LoginResponse> => {
    const res = await client.post<LoginResponse>("/auth/login", payload);
    return res.data;
};

export const getCurrentUser = async (): Promise<User> => {
    const res = await client.get<User>("/auth/me");
    return res.data;
};

// 호환성을 위해 유지 (필요시 제거 가능)
export const fetchUserByUsername = async (username: string): Promise<User> => {
    const res = await client.get<User>("/auth/user", { params: { username } });
    return res.data;
};