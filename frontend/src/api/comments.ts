import client from "./client";

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

export const getComments = async (postId: number): Promise<Comment[]> => {
  const res = await client.get<BackendCommentResponse[]>(`/posts/${postId}/comments`);
  // 백엔드 응답을 프론트엔드 형식으로 변환
  return res.data.map(comment => ({
    id: comment.id,
    content: comment.content,
    author: comment.authorId && comment.authorUsername ? {
      id: comment.authorId,
      username: comment.authorUsername
    } : undefined
  }));
};

export const addComment = async (
  postId: number,
  payload: { content: string }
): Promise<Comment> => {
  const res = await client.post<BackendCommentResponse>(`/posts/${postId}/comments`, payload);
  // 백엔드 응답을 프론트엔드 형식으로 변환
  const comment = res.data;
  return {
    id: comment.id,
    content: comment.content,
    author: comment.authorId && comment.authorUsername ? {
      id: comment.authorId,
      username: comment.authorUsername
    } : undefined
  };
};

export const updateComment = async (
  postId: number,
  commentId: number,
  payload: { content: string }
): Promise<Comment> => {
  const res = await client.put<BackendCommentResponse>(
    `/posts/${postId}/comments/${commentId}`,
    payload
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
  };
};

export const deleteComment = async (postId: number, commentId: number): Promise<void> => {
  await client.delete(`/posts/${postId}/comments/${commentId}`);
};