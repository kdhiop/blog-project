import axios from "axios";
const BASE = "http://localhost:8080";

export interface Post {
  id: number;
  title: string;
  content: string;
  author?: { id: number; username: string };
}

// 백엔드 응답 형식
interface BackendPostResponse {
  id: number;
  title: string;
  content: string;
  authorId?: number;
  authorUsername?: string;
}

// 백엔드 응답을 프론트엔드 형식으로 변환하는 함수
const mapBackendPost = (post: BackendPostResponse): Post => ({
  id: post.id,
  title: post.title,
  content: post.content,
  author: post.authorId && post.authorUsername ? {
    id: post.authorId,
    username: post.authorUsername
  } : undefined
});

export const getPosts = async () => {
  const res = await axios.get<BackendPostResponse[]>(`${BASE}/posts`);
  return res.data.map(mapBackendPost);
};

export const getPost = async (id: number) => {
  const res = await axios.get<BackendPostResponse>(`${BASE}/posts/${id}`);
  return mapBackendPost(res.data);
};

export const createPost = async (userId: number, payload: { title: string; content: string }) => {
  const res = await axios.post<BackendPostResponse>(`${BASE}/posts`, payload, { params: { userId } });
  return mapBackendPost(res.data);
};

export const updatePost = async (id: number, userId: number, payload: { title: string; content: string }) => {
  const res = await axios.put<BackendPostResponse>(`${BASE}/posts/${id}`, payload, { params: { userId } });
  return mapBackendPost(res.data);
};

export const deletePost = async (id: number, userId: number) => {
  await axios.delete(`${BASE}/posts/${id}`, { params: { userId } });
};