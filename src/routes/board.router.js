import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/** 게시물 생성 API **/
router.post("/boards", authMiddleware, async (req, res, next) => {
  try {
    const id = req.user.id;
    const { status, category, title, content } = req.body;

    if (!title) {
      return res.status(400).json({ errorMessage: "제목을 입력해주세요." });
    }
    if (!content) {
      return res
        .status(400)
        .json({ errorMessage: "사건 내용을 입력해주세요." });
    }

    const board = await prisma.board.create({
      data: {
        userId: id,
        category,
        title,
        content,
        status,
      },
    });

    const boardId = Number(board.id);

    const createdBoard = await prisma.board.findFirst({
      where: {
        id: +boardId,
      },
      select: {
        users: {
          select: {
            nickname: true,
            role: true,
          },
        },
        category: true,
        title: true,
        content: true,
        status: true,
        recom: true,
        createdAt: true,
      },
    });

    createdBoard.recom = createdBoard.recom.toString;

    return res
      .status(201)
      .json({ success: "사건 생성이 완료되었습니다.", data: createdBoard });
  } catch (error) {
    next(error);
  }
});

/** 게시글 목록 조회 API **/
router.get("/boards", async (req, res, next) => {
  const orderKey = req.query.orderKey ?? "id";
  const orderValue = req.query.orderValue ?? "desc";

  if (!["id", "status"].includes(orderKey)) {
    return res
      .status(400)
      .json({ errorMessage: "orderKey가 올바르지 않습니다." });
  }
  if (!["asc", "desc"].includes(orderValue.toLocaleLowerCase())) {
    return res
      .status(400)
      .json({ errorMessage: "orderValue가 올바르지 않습니다." });
  }

  try {
    const boards = await prisma.board.findMany({
      select: {
        id: true,
        users: {
          select: {
            nickname: true,
            role: true,
          },
        },
        category: true,
        title: true,
        status: true,
        recom: true,
        createdAt: true,
      },
      orderBy: {
        [orderKey]: orderValue,
      },
    });

    console.log(boards);

    if (!boards.length) {
      return res
        .status(404)
        .json({ errorMessage: "사건 조회에 실패하였습니다." });
    }

    return res
      .status(200)
      .json({ success: "사건이 성공적으로 조회되었습니다." });
  } catch (error) {
    next(error);
  }
});

/** 팔로우한 회원 게시글 조회 API **/
router.post("/boards/follow", authMiddleware, async (req, res, next) => {
  try {
    // 팔로우 로직 추가 후 수정하기
  } catch (error) {
    next(error);
  }
});

/** 게시글 상세 조회 API **/
router.get("/boards/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const boardId = Number(id);

    const board = await prisma.board.findFirst({
      where: {
        id: +boardId,
      },
      select: {
        users: {
          select: {
            nickname: true,
            role: true,
          },
        },
        category: true,
        title: true,
        content: true,
        status: true,
        recom: true,
        createdAt: true,
      },
    });
    console.log("🚀 ~ router.get ~ board:", board);

    if (!board) {
      return res
        .status(404)
        .json({ errorMessage: "사건 조회에 실패하였습니다." });
    }

    return res
      .status(200)
      .json({ success: "사건이 성공적으로 조회되었습니다." });
  } catch (error) {
    next(error);
  }
});

/** 게시글 수정 API **/
router.patch("/boards/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, content, status } = req.body;

    if (!category) {
      return res
        .status(400)
        .json({ errorMessage: "수정할 카테고리를 입력해주세요." });
    }
    if (!title) {
      return res
        .status(400)
        .json({ errorMessage: "수정할 제목을 입력해주세요." });
    }
    if (!content) {
      return res
        .status(400)
        .json({ errorMessage: "수정할 내용을 입력해주세요." });
    }
    if (!status) {
      return res
        .status(400)
        .json({ errorMessage: "변경할 상태를 입력해주세요." });
    }

    const userId = req.user.id;
    const boardId = Number(id);

    const board = await prisma.board.findFirst({
      where: {
        id: +boardId,
      },
      select: {
        userId: true,
        category: true,
        title: true,
        content: true,
        status: true,
      },
    });

    if (!board) {
      return res
        .status(404)
        .json({ errorMessage: "사건 조회에 실패하였습니다." });
    }
    if (userId !== board.userId) {
      return res
        .status(404)
        .json({ errorMessage: "본인이 작성한 사건이 아닙니다." });
    }

    const updateBoard = await prisma.board.update({
      where: {
        id: +id,
      },
      data: {
        category: category,
        title: title,
        status: status,
        content: content,
      },
    });
    console.log("🚀 ~ router.patch ~ updateBoard:", updateBoard);

    return res.status(200).json({
      success: "사건이 성공적으로 수정되었습니다.",
    });
  } catch (error) {
    next(error);
  }
});

/** 게시글 삭제 API **/
router.delete("/boards/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const boardId = Number(id);

    const board = await prisma.board.findFirst({
      where: {
        id: +boardId,
      },
    });

    const userId = req.user.id;

    if (!board) {
      return res
        .status(404)
        .json({ errorMessage: "사건 조회에 실패하였습니다." });
    }

    if (userId !== board.userId) {
      return res
        .status(404)
        .json({ errorMessage: "본인이 작성한 사건이 아닙니다." });
    }

    const deleteBoard = await prisma.board.delete({
      where: {
        id: +id,
      },
    });
    console.log("🚀 ~ router.delete ~ deleteBoard:", deleteBoard);

    return res.status(200).json({
      success: "사건이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
