import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

// 댓글 작성
router.post("/boards/:boardId/comments", authMiddleware, async (req, res, next) => {
  const { boardId } = req.params;
  const { content } = req.body;
  const { id } = req.user;

  const board = await prisma.boards.findFirst({
    where: { id: +boardId },
  });

  if (!board) {
    return res.status(404).json({ errorMessage: "사건이 존재하지 않습니다." });
  }
  if (!content) {
    return res.status(400).json({ errorMessage: "작성된 내용이 존재하지 않습니다." });
  }
  if (!id) {
    return res.status(400).json({ errorMessage: "유저가 존재하지 않습니다." });
  }

  const comment = await prisma.comments.create({
    data: {
      userId: id,
      boardId: +boardId,
      content: content,
    },
  });
  console.log(comment);

  return res.status(201).json({ success: "댓글이 생성되었습니다." });
});

// 댓글 조회
router.get("/boards/:boardId/comments", async (req, res, next) => {
  const boardId = req.params.boardId;
  const id = BigInt(boardId);
  const comments = await prisma.comments.findMany({
    select: {
      id: true,
      users: {
        select: {
          nickname: true,
        },
      },
      content: true,
      createdAt: true,
      like: true,
    },
    where: {
      boardId: id,
    },
  });

  console.log(comments);
  return res.status(200).json({ success: "댓글 조회가 성공적으로 진행되었습니다." });
});

// 댓글 수정
router.patch("/boards/:boardId/comments/:commentsId", authMiddleware, async (req, res, next) => {
  const boardId = req.params.boardId;
  const commentsId = req.params.commentsId;
  const { id } = req.user;
  const { content } = req.body;

  if (!id) {
    return res.status(400).json({
      errorMessage: "유저가 존재하지 않습니다.",
    });
  }

  const board = await prisma.comments.findFirst({
    where: {
      id: BigInt(boardId),
    },
  });

  if (!board) {
    return res.status(400).json({
      errorMessage: "게시물이 존재하지 않습니다.",
    });
  }

  if (!content) {
    return res.status(400).json({
      errorMessage: "수정할 내용을 입력해주세요.",
    });
  }

  const comment = await prisma.comments.findFirst({
    where: {
      id: BigInt(commentsId),
    },
  });

  if (!comment) {
    return res.status(400).json({
      errorMessage: "댓글이 존재하지 않습니다.",
    });
  }

  if (comment.userId !== id) {
    return res.status(400).json({
      errorMessage: "본인이 작성한 댓글이 아닙니다.",
    });
  }

  const changeContent = await prisma.comments.update({
    where: {
      id: BigInt(commentsId),
    },
    data: {
      content: content,
    },
  });

  console.log(changeContent);
  return res.status(201).json({ success: "댓글 수정이 완료되었습니다." });
});

// 댓글 삭제
router.delete("/boards/:boardId/comments/:commentsId", authMiddleware, async (req, res, next) => {
  const boardId = req.params.boardId;
  const commentsId = req.params.commentsId;
  const { id } = req.user;

  if (!id) {
    return res.status(400).json({
      errorMessage: "유저가 존재하지 않습니다.",
    });
  }

  const board = await prisma.comments.findFirst({
    where: {
      id: BigInt(boardId),
    },
  });

  if (!board) {
    return res.status(400).json({
      errorMessage: "게시물이 존재하지 않습니다.",
    });
  }

  const comment = await prisma.comments.findFirst({
    where: {
      id: BigInt(commentsId),
    },
  });

  if (!comment) {
    return res.status(400).json({
      errorMessage: "댓글이 존재하지 않습니다.",
    });
  }

  if (comment.userId !== id) {
    return res.status(400).json({
      errorMessage: "본인이 작성한 댓글이 아닙니다.",
    });
  }

  await prisma.comments.delete({
    where: {
      id: BigInt(commentsId),
    },
  });

  return res.status(201).json({ success: "댓글 삭제가 완료되었습니다." });
});

export default router;
