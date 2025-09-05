import axios from "axios";

const BASE = "http://localhost:8080";

export interface User {
  id: number;
  username: string;
}

export const register = async (payload: { username: string; password: string }) => {
  const res = await axios.post(`${BASE}/auth/register`, payload);
  // res.data: { id, username, password: "<hashed>" }  ← 백엔드 그대로
  return { id: res.data.id as number, username: res.data.username as string } as User;
};

export const login = async (payload: { username: string; password: string }) => {
  // 성공 시 200 + "로그인 성공"
  const res = await axios.post(`${BASE}/auth/login`, payload, { responseType: "text" });
  if (res.status === 200) return true;
  return false;
};

export const fetchUserByUsername = async (username: string) => {
  const res = await axios.get(`${BASE}/auth/user`, { params: { username } });
  return { id: res.data.id as number, username: res.data.username as string } as User;
};
