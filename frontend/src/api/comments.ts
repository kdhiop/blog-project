import axios from "axios";
const BASE = "http://localhost:8080";

export interface Comment {
  id: number;
  content: string;
  author?: { id: number; username: string };
}

// 백엔드 응답 형식
interface BackendCommentResponse {
  id: number;
  content: string;
  authorId?: number;
  authorUsername?: string;
}

export const getComments = async (postId: number) => {
  const res = await axios.get<BackendCommentResponse[]>(`${BASE}/posts/${postId}/comments`);
  // 백엔드 응답을 프론트엔드 형식으로 변환
  return res.data.map(comment => ({
    id: comment.id,
    content: comment.content,
    author: comment.authorId && comment.authorUsername ? {
      id: comment.authorId,
      username: comment.authorUsername
    } : undefined
  })) as Comment[];
};

export const addComment = async (
  postId: number,
  userId: number,
  payload: { content: string }
) => {
  const res = await axios.post<BackendCommentResponse>(`${BASE}/posts/${postId}/comments`, payload, {
    params: { userId },
  });
  // 백엔드 응답을 프론트엔드 형식으로 변환
  const comment = res.data;
  return {
    id: comment.id,
    content: comment.content,
    author: comment.authorId && comment.authorUsername ? {
      id: comment.authorId,
      username: comment.authorUsername
    } : undefined
  } as Comment;
};

// 댓글 수정 API 추가
export const updateComment = async (
  postId: number,
  commentId: number,
  userId: number,
  payload: { content: string }
) => {
  const res = await axios.put<BackendCommentResponse>(
    `${BASE}/posts/${postId}/comments/${commentId}`, 
    payload, 
    { params: { userId } }
  );
  // 백엔드 응답을 프론트엔드 형식으로 변환
  const comment = res.data;
  return {
    id: comment.id,
    content: comment.content,
    author: comment.authorId && comment.authorUsername ? {
      id: comment.authorId,
      username: comment.authorUsername
    } : undefined
  } as Comment;
};

export const deleteComment = async (postId: number, commentId: number, userId: number) => {
  await axios.delete(`${BASE}/posts/${postId}/comments/${commentId}`, { params: { userId } });
};