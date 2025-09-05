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
