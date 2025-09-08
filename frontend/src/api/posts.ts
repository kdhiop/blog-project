import axios from "axios";
const BASE = "http://localhost:8080";

export interface Post {
  id: number;
  title: string;
  content: string;
  author?: { id: number; username: string };
}

export const getPosts = async () => {
  const res = await axios.get<Post[]>(`${BASE}/posts`);
  return res.data;
};

export const getPost = async (id: number) => {
  const res = await axios.get<Post>(`${BASE}/posts/${id}`);
  return res.data;
};

export const createPost = async (userId: number, payload: { title: string; content: string }) => {
  const res = await axios.post<Post>(`${BASE}/posts`, payload, { params: { userId } });
  return res.data;
};

export const updatePost = async (id: number, userId: number, payload: { title: string; content: string }) => {
  const res = await axios.put<Post>(`${BASE}/posts/${id}`, payload, { params: { userId } });
  return res.data;
};

export const deletePost = async (id: number, userId: number) => {
  await axios.delete(`${BASE}/posts/${id}`, { params: { userId } });
};