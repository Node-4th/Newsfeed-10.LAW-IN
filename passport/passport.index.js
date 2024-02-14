// 인증 전략을 등록하고, 데이터를 저장하거나 불러올때 이용

import passport from "passport";
import KakaoStrategy from "./kakao.strategy.js";
import { prisma } from "../utils/prisma/index.js";

export default function () {
  passport.serializeUser((user, done) => {
    // 로그인시 실행
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    prisma.users
      .findOne({ where: { id } })
      .then((user) => {
        done(null, user);
      })
      .catch((err) => done(err));
  });
  // KakaoStrategy 미들웨어 사용
  KakaoStrategy();
}
