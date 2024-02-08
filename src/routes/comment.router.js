import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 댓글 작성
router.post(
  "/boards/:boardId/comments",
  authMiddleware,
  async (req, res, next) => {
    const { boardId } = req.params;
    const { content } = req.body;
    const { userId } = req.user.id;

    const board = await prisma.posts.findFirst({
      where: { boardId: +boardId },
    });

    if (!board) {
      return res
        .status(404)
        .json({ errorMessage: "사건이 존재하지 않습니다." });
    }
    if (!content) {
      return res
        .status(400)
        .json({ errorMessage: "작성된 내용이 존재하지 않습니다." });
    }

    const comment = await prisma.comments.create({
      data: {
        userId: userId,
        content: content,
        like: like,
      },
    });

    const commentInfo = await prisma.comments.findFirst({
      where: {
        id: +commentId,
      },
      select: {
        users: {
          nickname: true,
        },
        content: true,
        createdAt: true,
        like: true,
      },
    });

    return res
      .status(201)
      .json({ success: "댓글이 생성되었습니다.", data: commentInfo });
  }
);

// 댓글 조회
router.get("/boards/:boardId/comments"),
  async (req, res, next) => {
    const commentId = req.params;

    const comments = await prisma.comments.findMany({
      where: { commentId: +commentId },
      select: {
        id: true,
        select: {
          users: {
            nickname: true,
          },
        },
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: "댓글 조회가 성공적으로 진행되었습니다.",
      data: comments,
    });
  };

// 댓글 수정
router.patch(
  "/boards/:boardId/comments/:id",
  authMiddleware,
  async (req, res, next) => {
    const user = res.user;
    const boardId = req.params.boardId;
    const { content } = req.body;
    if (!id) {
      return res.status(400).json({
        errorMessage: "id는 필수값입니다.",
      });
    }
    if (!content) {
      return res.status(400).json({
        errorMessage: "작성된 내용이 존재하지 않습니다.",
      });
    }

    const comment = await prisma.comments.findFirst({
      where: {
        id: +id,
      },
    });

    if (!comment) {
      return res.status(400).json({
        errorMessage: "댓글이 존재하지 않습니다.",
      });
    }

    if (comment.userId !== user.userId) {
      return res.status(400).json({
        errorMessage: "올바르지 않은 요청입니다.",
      });
    }

    await prisma.comment.update({
      where: {
        boardId: +boardId,
      },
      data: {
        content,
      },
    });

    return res.status(201).json({ success: "댓글 수정이 완료되었습니다." });
  }
);

// 댓글 삭제
router.delete(
  "/boards/:boardId/comments/:id",
  authMiddleware,
  async (req, res, next) => {
    const user = res.user;
    const boardId = req.params.boardId;

    if (!id) {
      return res.status(400).json({
        errorMessage: "id는 필수값입니다.",
      });
    }

    const comment = await prisma.comments.findFirst({
      where: {
        id: +id,
      },
    });

    if (!comment) {
      return res
        .status(400)
        .json({ errorMessage: "댓글이 존재하지 않습니다." });
    }
    if (comment.userId !== user.userId) {
      return res
        .status(400)
        .json({ errorMessage: "올바르지 않은 요청입니다." });
    }

    await prisma.comment.delete({
      where: {
        id: +id,
      },
    });

    return res.status(201).json({ success: "댓글 삭제가 완료되었습니다." });
  }
);

export default router;
