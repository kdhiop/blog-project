import axios from "axios";
const BASE = "http://localhost:8080";

export interface Comment {
  id: number;
  content: string;
  author?: { id: number; username: string };
}

export const getComments = async (postId: number) => {
  const res = await axios.get<Comment[]>(`${BASE}/posts/${postId}/comments`);
  return res.data;
};

export const addComment = async (
  postId: number,
  userId: number,
  payload: { content: string }
) => {
  const res = await axios.post<Comment>(`${BASE}/posts/${postId}/comments`, payload, {
    params: { userId },
  });
  return res.data;
};

export const deleteComment = async (postId: number, commentId: number, userId: number) => {
  await axios.delete(`${BASE}/posts/${postId}/comments/${commentId}`, { params: { userId } });
};