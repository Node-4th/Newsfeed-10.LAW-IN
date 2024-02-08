// src/middlewares/auth.middleware.js // 사용자 인증 미들웨어

import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";

export default async function (req, res, next) {
  try {
    let { accessToken, refreshToken } = req.cookies;
    let resetAccess = accessToken;

    if (!refreshToken) {
      throw new Error("토큰이 존재하지 않습니다.");
    }

    const refresh = await tokencheck(refreshToken);
    const isExistToken = await prisma.users.findFirst({
      where: {
        token: refresh,
      },
    });

    if (isExistToken && !accessToken) {
      const decodedToken = jwt.verify(refresh, process.env.JWT_SECRET_KEY);
      const email = decodedToken.email;
      const user = await prisma.users.findFirst({
        where: {
          email: email,
        },
        select: {
          id: true,
        },
      });

      accessToken = jwt.sign(
        {
          id: user.id,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "12h" }
      );
      res.cookie("accessToken", `Bearer ${accessToken}`);
      resetAccess = `Bearer ${accessToken}`;
    }

    const access = tokencheck(resetAccess);
    const decodedToken = jwt.verify(access, process.env.JWT_SECRET_KEY);
    const id = decodedToken.id;
    const user = await prisma.users.findFirst({
      where: { id: +id },
    });

    if (!user) {
      res.clearCookie("refreshToken");
      res.clearCookie("accessToken");
      throw new Error("토큰 사용자가 존재하지 않습니다.");
    }
    req.user = user;
    next();
  } catch (error) {
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    switch (error.name) {
      case "TokenExpiredError":
        return res.status(401).json({ message: "토큰이 만료되었습니다. 다시 로그인 해주세요" });

      case "JsonWebTokenError":
        return res.status(401).json({ message: "토큰이 조작되었습니다." });

      default:
        return res.status(401).json({ message: error.message ?? "비정상적인 요청입니다." });
    }
  }
}

function tokencheck(tokenKind) {
  const [tokenType, token] = tokenKind.split(" ");
  if (tokenType !== "Bearer") throw new Error("토큰 타입이 일치하지 않습니다.");
  else return token;
}
