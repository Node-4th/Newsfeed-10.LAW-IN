import express from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import nodemailer from "nodemailer";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as KakaoStrategy } from "passport-kakao";
const router = express.Router();
// const KakaoStrategy = passport-kakao.Strategy;

//NOTE - 회원가입
router.post("/sign-up", async (req, res, next) => {
  try {
    const { id, email, password, passwordCheck, nickname, content } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "아이디가 입력되지 않았습니다." });
    }
    if (id == password) {
      return res.status(400).json({ success: false, message: "아이디와 비밀번호는 같을 수 없습니다." });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: "이메일이 입력되지 않았습니다." });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "비밀번호가 입력되지 않았습니다." });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "비밀번호는 6자 이상이어야 합니다.",
      });
    }

    if (!passwordCheck) {
      return res.status(400).json({ success: false, message: "비밀번호를 다시 한 번 입력해주세요." });
    }
    if (password !== passwordCheck) {
      return res.status(400).json({
        success: false,
        message: "비밀번호가 일치하지 않습니다.",
      });
    }

    if (!nickname) {
      return res.status(400).json({ success: false, message: "별명이 입력되지 않았습니다." });
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
      return res.status(409).json({ success: false, message: "이미 존재하는 아이디입니다." });
    }
    if (isExistEmail) {
      return res.status(409).json({ success: false, message: "이미 존재하는 이메일입니다." });
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

    return res.status(201).json({ userInfo: createdUser });
  } catch (err) {
    next(err);
  }
});

// NOTE - 인증번호 발송
router.get("/mail-check", AuthMiddleware, async (req, res) => {
  try {
    const { email } = req.user;

    const authCode = Math.random().toString(36).substring(2, 8);
    const hashedCode = await bcrypt.hash(authCode, 10);

    const checkMail = (data) => {
      return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>이메일 인증</title>
            </head>
            <body>
                <div> 인증번호는 ${data} 입니다. </div>
            </body>
            </html>
            `;
    };

    const getEmailData = (to, authCode) => {
      return {
        from: process.env.NODEMAILER_USER,
        to,
        subject: "이메일 인증",
        html: checkMail(authCode),
      };
    };

    const sendEmail = (to, authCode) => {
      const smtpTransport = nodemailer.createTransport({
        pool: true,
        service: "naver",
        host: "smtp.naver.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.NODEMAILER_USER, // 보내는 사람 이메일
          pass: process.env.NODEMAILER_PASS, // 비밀번호
        },
        tls: { rejectUnauthorized: false },
      });

      const mail = getEmailData(to, authCode);

      smtpTransport.sendMail(mail, function (error, response) {
        if (error) {
          console.error("이메일 전송 실패:", error);
          smtpTransport.close();
          return res.status(500).json({ message: "인증 메일 전송에 실패했습니다." });
        } else {
          console.log("이메일 전송 성공.");
          smtpTransport.close();
        }
      });
    };

    sendEmail(email, authCode);

    res.cookie("authCode", hashedCode, { maxAge: 3600000 });

    return res.status(200).json({ success: true, message: "인증 메일이 발송되었습니다." });
  } catch (err) {
    next(err);
  }
});

// NOTE - 인증번호 확인
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
      message: "사용자가 존재하지 않습니다",
    });
  } else if (!(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ success: false, message: "비밀번호가 일치하지 않습니다." });
  }

  // 사용자를 삭제합니다.
  await prisma.users.delete({
    where: {
      id: user.id,
    },
  });

  return res.status(201).json({ success: true, message: "회원 탈퇴가 완료되었습니다." });
});

//NOTE - 로그인
router.post("/sign-in", async (req, res) => {
  const { id, password } = req.body;

  const user = await prisma.users.findFirst({ where: { id } });
  console.log(await bcrypt.compare(password, user.password));

  if (!user) {
    return res.status(401).json({ success: false, message: "존재하지 않는 이메일 입니다." });
  } else if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ success: false, message: "비밀번호가 일치하지 않습니다." });
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

  return res.status(200).json({ success: true, message: "로그인에 성공하였습니다." });
});

//NOTE - 로그아웃
router.post("/log-out", AuthMiddleware, async (req, res) => {
  const { id, token } = req.user;
  if (!token) {
    return res.status(401).json({ success: false, message: "토큰이 존재하지 않습니다." });
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
    return res.status(401).json({
      success: false,
      message: "비밀번호의 길이가 짧거나 두 비밀번호가 일치하지 않습니다.",
    });
  }

  if (!user) {
    return res.status(401).json({ success: false, message: "아이디가 존재하지 않습니다" });
  } else if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ success: false, message: "비밀번호가 일치하지 않습니다." });
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
  return res.status(201).json({ success: true, message: "회원 정보가 수정되었습니다.", userInfo: updateUser });
});

// 카카오 로그인
passport.use(
  "kakao",
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_KEY, // 카카오에서 발급받은 rest api 키
      clientSecret: process.env.KAKAO_SECRET, // 카카오에서 발급받은 클라이언트 시크릿 키
      callbackURL: "http://localhost:3010/api/log-in/kakao/callback", // 카카오 로그인 리디렉트 경로(로그인 후 카카오가 결과 전송할 url)
    },
    async (accessToken, refreshToken, profile, done) => {
      // 로그인 성공하면 카카오가 토큰을 보내주고, profile에는 카카오가 보내준 유저 정보 담겨있음
      // 가입 이력이 있으면 바로 done, 없으면 그자리에서 회원가입 후 done
      console.log(accessToken);
      console.log(profile);
    }
  )
);

router.get("/log-in/kakao", passport.authenticate("kakao")); // 요청 들어오고 카카오 로그인 페이지로 이동

router.get(
  "/log-in/kakao/callback", // 카카오에서 설정한 리디렉트 url로 요청 재전달
  passport.authenticate("kakao", {
    // passport-kakao는 req.login을 자체적으로 호출하기 때문에 인자에 콜백함수 안들어감
    failureRedirect: "/log-in", // 유저가 카카오 연동 로그인에 실패했을 경우 해당 라우터로 이동
  }),
  (req, res, next) => {
    // 유저가 로그인 성공하면 다음 라우터로 이동
    res.redirect("/");
  }
);

export default router;
