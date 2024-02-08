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

    // 댓글 달 게시글 존재x
    if (!board) {
      return res.status(404).json({ success: "게시글이 존재하지 않습니다." });
    }
    // 댓글 내용 존재x
    if (!content) {
      return res
        .status(400)
        .json({ message: "작성된 내용이 존재하지 않습니다." });
    }

    const comment = await prisma.comments.create({
      data: {
        boardId: +boardId,
        userId: +userId,
        content: content,
      },
    });

    return res
      .status(201)
      .json({ success: "댓글이 생성되었습니다.", data: comment });
  }
);

// 댓글 조회
router.get("/boards/:boardId/comments"),
  async (req, res, next) => {
    const { boardId } = req.params;
    const { nickname } = req.body;

    const comments = await prisma.comments.findMany({
      where: { boardId: +boardId },
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

    return res
      .status(200)
      .json({
        success: "댓글 조회가 성공적으로 진행되었습니다.",
        data: comments,
      });
  };

export default router;
