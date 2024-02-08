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
    const boardId = req.params.boardId;
    const { content } = req.body;
    if (!boardId) {
      return res.status(400).json({
        success: "boardId는 필수값입니다.",
      });
    }
    if (!content) {
      return res.status(400).json({
        success: "작성된 내용이 존재하지 않습니다.",
      });
    }

    const board = await prisma.board.findFirst({
      where: {
        boardId: +boardId,
      },
    });

    if (!board) {
      return res.status(400).json({
        success: "게시글이 존재하지 않습니다.",
      });
    }

    if (board.userId !== user.userId) {
      return res.status(400).json({
        success: "올바르지 않은 요청입니다.",
      });
    }

    await prisma.board.update({
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

export default router;
