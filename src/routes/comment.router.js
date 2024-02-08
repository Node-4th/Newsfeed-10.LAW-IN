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
    const { userId } = req.user;

    const post = await prisma.posts.findFirst({ where: { boardId: +boardId } });
    if (!board) {
      return res.status(404).json({ message: "게시글이 존재하지 않습니다." });
    }

    const comment = await prisma.comments.create({
      data: {
        boardId: +boardId,
        userId: +userId,
        content: content,
      },
    });

    return res.status(201).json({ data: comment });
  }
);

export default router;
