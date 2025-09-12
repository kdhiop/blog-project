import client from "./client";

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

export const getPosts = async (searchQuery?: string): Promise<Post[]> => {
  const params = searchQuery ? { search: searchQuery } : {};
  const res = await client.get<BackendPostResponse[]>("/posts", { params });
  return res.data.map(mapBackendPost);
};

export const searchPosts = async (query: string): Promise<Post[]> => {
  if (!query || query.trim().length < 2) {
    throw new Error("검색어는 2자 이상이어야 합니다");
  }
  
  const res = await client.get<BackendPostResponse[]>("/posts/search", {
    params: { q: query.trim() }
  });
  return res.data.map(mapBackendPost);
};

export const getPost = async (id: number): Promise<Post> => {
  const res = await client.get<BackendPostResponse>(`/posts/${id}`);
  return mapBackendPost(res.data);
};

export const createPost = async (payload: { title: string; content: string }): Promise<Post> => {
  const res = await client.post<BackendPostResponse>("/posts", payload);
  return mapBackendPost(res.data);
};

export const updatePost = async (id: number, payload: { title: string; content: string }): Promise<Post> => {
  const res = await client.put<BackendPostResponse>(`/posts/${id}`, payload);
  return mapBackendPost(res.data);
};

export const deletePost = async (id: number): Promise<void> => {
  await client.delete(`/posts/${id}`);
};