import express from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import MailingMiddleware from "../middlewares/mailing.middleware.js";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const router = express.Router();

//NOTE - 회원가입
router.post("/sign-up", MailingMiddleware, async (req, res, next) => {
  try {
    const { id, email, password, passwordCheck, nickname, content } = req.body;

    if (!id) {
      return res.status(400).json({ message: "아이디가 입력되지 않았습니다." });
    }
    if (!email) {
      return res.status(400).json({ message: "이메일이 입력되지 않았습니다." });
    }
    if (!password) {
      return res.status(400).json({ message: "비밀번호가 입력되지 않았습니다." });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "비밀번호는 6자 이상이어야 합니다.",
      });
    }

    if (!passwordCheck) {
      return res.status(400).json({ message: "비밀번호를 다시 한 번 입력해주세요." });
    }
    if (password !== passwordCheck) {
      return res.status(400).json({
        message: "비밀번호가 일치하지 않습니다.",
      });
    }

    if (!nickname) {
      return res.status(400).json({ message: "별명이 입력되지 않았습니다." });
    }

    const isExistUser = await prisma.users.findFirst({
      where: {
        id: id,
      },
    });

    const isExistEmail = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });

    if (isExistUser) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }
    if (isExistEmail) {
      return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          id,
          email,
          password: hashedPassword,
          nickname,
          content,
        },
      });

      const userInfo = await tx.users.findFirst({
        where: {
          id: user.id,
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          content: true,
          role: true,
          follow: true,
        },
      });

      userInfo.follow = userInfo.follow.toString();

      return userInfo;
    });

    return res.status(201).json({ message: "인증 메일이 발송되었습니다.", userInfo: createdUser });
  } catch (err) {
    next(err);
  }
});

router.post("/mail-check", AuthMiddleware, async (req, res) => {
  try {
    const { id } = req.user;
    const { authCode } = req.body;

    if (req.user.isEmailValid) {
      return res.status(401).json({ message: "이미 인증된 사용자입니다." });
    }

    if (!authCode) {
      return res.status(401).json({ message: "인증 번호를 입력해주세요." });
    }

    if (!(await bcrypt.compare(authCode, req.cookies.authCode))) {
      return res.status(401).json({ message: "인증번호가 일치하지 않습니다." });
    }

    await prisma.users.update({
      where: {
        id,
      },
      data: {
        isEmailValid: true,
      },
    });

    res.clearCookie("authCode");

    return res.status(200).json({ success: true, message: "이메일 인증이 완료되었습니다." });
  } catch (err) {
    next(err);
  }
});

//NOTE - 회원탈퇴
router.delete("/sign-out", AuthMiddleware, async (req, res) => {
  const { id } = req.user;
  const { password } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: "사용자를 찾을 수 없습니다." });
  }
  const user = await prisma.users.findFirst({
    where: {
      id,
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "해당 ID로 사용자를 찾을 수 없습니다.",
    });
  } else if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
  }

  // 사용자를 삭제합니다.
  await prisma.users.delete({
    where: {
      id: user.id,
    },
  });

  return res.status(200).json({ success: true, message: "사용자가 성공적으로 삭제되었습니다." });
});

//NOTE - 로그인
router.post("/sign-in", async (req, res) => {
  const { id, password } = req.body;

  const user = await prisma.users.findFirst({ where: { id } });
  console.log(await bcrypt.compare(password, user.password));

  if (!user) {
    return res.status(401).json({ message: "존재하지 않는 이메일 입니다." });
  } else if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
  }

  const accessToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "12h" }
  );
  const refreshToken = jwt.sign(
    {
      email: user.email,
      ip: req.ip,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "168h" }
  );

  await prisma.users.update({
    where: {
      id: user.id,
    },
    data: {
      token: refreshToken,
    },
  });

  res.cookie("accessToken", `Bearer ${accessToken}`);
  res.cookie("refreshToken", `Bearer ${refreshToken}`);

  return res.status(200).json({ message: "로그인에 성공하였습니다." });
});

//NOTE - 로그아웃
router.post("/log-out", AuthMiddleware, async (req, res) => {
  const { id, token } = req.user;
  if (!token) {
    return res.status(400).json({ success: false, message: "토큰이 존재하지 않습니다." });
  }

  await prisma.users.update({
    where: {
      id,
    },
    data: {
      token: null,
    },
  });
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.status(200).json({ success: true, message: "로그아웃이 성공적으로 완료 되었습니다." });
});

//NOTE - 내정보 조회
router.get("/myInfo", AuthMiddleware, async (req, res) => {
  const { id } = req.user;

  const user = await prisma.users.findFirst({
    where: { id: id },
    select: {
      id: true,
      email: true,
      nickname: true,
      content: true,
      role: true,
      follow: true,
    },
  });

  user.follow = user.follow.toString();

  return res.status(200).json({ data: user });
});

//NOTE - 내정보 수정
router.patch("/myInfo", AuthMiddleware, async (req, res) => {
  const { nickname, content, password, passwordCheck } = req.body;
  const { id } = req.user;

  const user = await prisma.users.findFirst({ where: { id } });

  if (password !== passwordCheck || password.length < 6) {
    return res.status(400).json({
      message: "비밀번호의 길이가 짧거나 두 비밀번호가 일치하지 않습니다.",
    });
  }

  if (!user) {
    return res.status(401).json({ message: "아이디가 존재하지 않습니다" });
  } else if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
  }

  const updateUser = await prisma.$transaction(async (tx) => {
    const user = await tx.users.update({
      where: {
        id: id,
      },
      data: {
        nickname,
        content,
      },
    });

    const userInfo = await tx.users.findFirst({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        content: true,
        role: true,
        follow: true,
      },
    });

    userInfo.follow = user.follow.toString();
    return userInfo;
  });
  return res.status(201).json({ success: "이력서 수정에 성공하였습니다.", userInfo: updateUser });
});

export default router;
