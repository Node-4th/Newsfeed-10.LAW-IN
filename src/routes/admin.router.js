import express from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();
const adminDelete = (req, res, next) => {
  const role = req.user.role;

  if (!(role === "MANAGER" || role === "OWNER")) {
    return res.status(403).json({ success: false, message: "관리자 삭제 권한이 없습니다." });
  }

  next();
};
//NOTE - 관리자로 회원 계정 삭제
router.delete("/admin", AuthMiddleware, adminDelete, async (req, res, next) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: "아이디가 입력되지 않았습니다." });
  }

  await prisma.users.delete({
    where: {
      id: id,
    },
  });

  return res.status(200).json({ success: true, message: "해당 계정이 삭제되었습니다." });
});

//NOTE - 관리자로 회원 정보 수정
router.patch("/admin/userInfo", AuthMiddleware, adminDelete, async (req, res, next) => {
  const { id, role } = req.body;

  const userId = await prisma.users.findFirst({
    where: {
      id: id,
    },
  });

  if (!userId) {
    return res.status(401).json({ success: false, message: "아이디가 존재하지 않습니다." });
  }

  if (!(role === "MANAGER" || role === "OWNER")) {
    return res.status(403).json({ success: false, message: "관리자의 권한이 없습니다." });
  }

  await prisma.users.update({
    where: {
      id: id,
    },
    data: {
      role,
    },
  });
  return res.status(201).json({ success: true, message: "상태수정이 완료 되었습니다." });
});

//NOTE - 관리자로 회원 게시글 삭제
router.delete("/admin/boards", AuthMiddleware, adminDelete, async (req, res, next) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, errorMessage: "게시물이 존재하지 않습니다." });
  }

  const boardId = Number(id);

  await prisma.boards.findFirst({
    where: {
      id: +boardId,
    },
  });

  const deleteBoard = await prisma.boards.delete({
    where: {
      id: +id,
    },
  });
  console.log("🚀 ~ router.delete ~ deleteBoard:", deleteBoard);

  return res.status(200).json({ success: true, success: "게시글 삭제가 완료 되었습니다.." });
});

export default router;
