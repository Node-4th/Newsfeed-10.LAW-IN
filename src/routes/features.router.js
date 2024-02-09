import express from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const router = express.Router();

router.post("/boards/:boardId/comments/:id/likes", AuthMiddleware, (req, res) => {
  // 유저아이디 받아오기(좋아요 누를 인원 , 인증검사 진행후)
  // 좋아요 테이블에 좋아요 체크하기
  // insert into likeTable (like) values ('like')
  // 좋아요 테이블에 게시물 아이디를 받아온다음 게시물 아이디에서 좋아요가 몇개인지 검색
  // select count(like) from likeTable where boardId = boardId and like = "like"
  // 두 쿼리를 하나의 트랜잭션으로 잡고 총 like갯수 반환한뒤 return
});

export default router;
