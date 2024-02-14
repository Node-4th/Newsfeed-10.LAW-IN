import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import imageUploader from "../s3/ImageUploader.js";

const router = express.Router();

/** 게시물 생성 API **/
router.post("/boards", authMiddleware, async (req, res, next) => {
  try {
    const id = req.user.id;
    const { status = "Notset", category = "Unspecified", title, content } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "제목을 입력해주세요." });
    }
    if (!content) {
      return res.status(400).json({ success: false, message: "사건 내용을 입력해주세요." });
    }

    const board = await prisma.boards.create({
      data: {
        userId: id,
        category,
        title,
        content,
        status,
      },
    });

    const boardId = Number(board.id);

    const createdBoard = await prisma.boards.findFirst({
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

    return res.status(201).json({ success: true, message: "사건 생성이 완료되었습니다.", data: createdBoard });
  } catch (error) {
    next(error);
  }
});

/** 게시글 목록 조회 API **/
router.get("/boards", async (req, res, next) => {
  try {
    const isLogIn = !!req.cookies.refreshToken;
    const orderKey = req.query.orderKey ?? "id";
    const orderValue = req.query.orderValue ?? "desc";

    if (!["id", "status"].includes(orderKey)) {
      return res.status(400).json({ success: false, message: "orderKey가 올바르지 않습니다." });
    }
    if (!["asc", "desc"].includes(orderValue.toLocaleLowerCase())) {
      return res.status(400).json({ success: false, message: "orderValue가 올바르지 않습니다." });
    }

    let boards = await prisma.boards.findMany({
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

    boards = categoryAndStatusCheck(boards);

    if (!boards.length) {
      return res.status(404).json({ success: false, message: "사건 조회에 실패하였습니다." });
    }

    const loginData = {
      isLogIn: isLogIn,
    };

    return res.status(200).render("board", { boards, loginData });
  } catch (error) {
    next(error);
  }
});

/** 팔로우한 회원 게시글 조회 API **/
router.get("/boards/follow", authMiddleware, async (req, res, next) => {
  try {
    const orderKey = req.query.orderKey ?? "id";
    const orderValue = req.query.orderValue ?? "desc";

    if (!["id", "status"].includes(orderKey)) {
      return res.status(400).json({ success: false, message: "orderKey가 올바르지 않습니다." });
    }
    if (!["asc", "desc"].includes(orderValue.toLocaleLowerCase())) {
      return res.status(400).json({ success: false, message: "orderValue가 올바르지 않습니다." });
    }

    const userId = req.user.id;
    const followedUsers = await prisma.follows.findMany({
      where: {
        followerId: userId,
      },
      select: { followedId: true },
    });

    const boards = await prisma.boards.findMany({
      where: {
        userId: followedUsers.followedId,
      },
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

    boards.forEach((board) => {
      board.id = board.id.toString;
      board.recom = board.recom.toString;
    });

    if (!boards.length) {
      return res.status(404).json({ success: false, message: "조회된 사건이 없습니다." });
    }

    return res.status(200).json({ success: true, boards, message: "사건이 성공적으로 조회되었습니다." });
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

    let board = await prisma.boards.findFirst({
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
        media: true,
        status: true,
        recom: true,
        createdAt: true,
      },
    });

    if (!board) {
      return res.status(404).render({ success: false, errorMessage: "사건 조회에 실패하였습니다." });
    }
    board = categoryAndStatusCheck(board);

    return res.status(200).render("detail", { board });
  } catch (error) {
    next(error);
  }
});

/** 게시글 본문 이미지 업로드 API **/
router.post("/boards/:id/upload-image", imageUploader.single("image"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const boardId = Number(id);
    const media = req.file;

    if (!media) {
      return res.status(400).json({
        success: false,
        message: "파일이 없습니다.",
      });
    }

    // 파일 주소 media에 넣어줌
    await prisma.boards.update({
      where: {
        id: +boardId,
      },
      data: {
        media: media.location,
      },
    });

    return res.status(200).json({
      success: true,
      message: "파일이 성공적으로 업로드되었습니다.",
    });
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
      return res.status(400).json({ success: false, message: "수정할 카테고리를 입력해주세요." });
    }
    if (!title) {
      return res.status(400).json({ success: false, message: "수정할 제목을 입력해주세요." });
    }
    if (!content) {
      return res.status(400).json({ success: false, message: "수정할 내용을 입력해주세요." });
    }
    if (!status) {
      return res.status(400).json({ success: false, message: "변경할 상태를 입력해주세요." });
    }

    const userId = req.user.id;
    const boardId = Number(id);

    const board = await prisma.boards.findFirst({
      where: {
        id: +boardId,
      },
    });

    if (!board) {
      return res.status(404).json({ success: false, message: "사건 조회에 실패하였습니다." });
    }
    if (userId !== board.userId) {
      return res.status(401).json({ success: false, message: "본인이 작성한 사건이 아닙니다." });
    }

    const updateBoard = await prisma.boards.update({
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
    updateBoard.id = board.id.toString;
    updateBoard.recom = board.recom.toString;

    return res.status(200).json({
      success: true,
      updateBoard,
      message: "사건이 성공적으로 수정되었습니다.",
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

    const board = await prisma.boards.findFirst({
      where: {
        id: +boardId,
      },
    });

    const userId = req.user.id;

    if (!board) {
      return res.status(404).json({ success: false, message: "사건 조회에 실패하였습니다." });
    }

    if (userId !== board.userId) {
      return res.status(401).json({ success: false, message: "본인이 작성한 사건이 아닙니다." });
    }

    const deleteBoard = await prisma.boards.delete({
      where: {
        id: +id,
      },
    });
    deleteBoard.id = board.id.toString;
    deleteBoard.recom = board.recom.toString;

    return res.status(201).json({
      success: true,
      deleteBoard,
      message: "사건이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

function categoryAndStatusCheck(boards) {
  const categoryMap = {
    Unspecified: "미지정",
    Fraud: "사기",
    Affair: "불륜",
    TrafficAccident: "교통사고",
    Theft: "도난",
    Violence: "폭행",
  };
  const statusMap = {
    Notset: "미설정",
    Proceeding: "진행중",
    Solved: "해결완료",
    Incomplete: "미완료",
  };
  let newCategory = "";
  let newStatus = "";

  if (typeof boards === "object" && Object.keys(boards).length > 0 && !Array.isArray(boards)) {
    boards.category = categoryMap[boards.category];
    boards.status = statusMap[boards.status];
  }

  for (let i = 0; i < boards.length; i++) {
    const category = boards[i].category;
    const status = boards[i].status;

    newCategory = categoryMap[category] || category;
    newStatus = statusMap[status] || status;

    boards[i].category = newCategory;
    boards[i].status = newStatus;
  }

  return boards;
}
