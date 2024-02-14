// 로컬 인증전략 절차 코드가 있는 파일이며, 라우터에서 요청이 들어오면 실행

import passport from "passport";
import kakaoPassport from "passport-kakao";
import { prisma } from "../utils/prisma/index.js";

dotenv.config();
const KakaoStrategy = kakaoPassport.Strategy;

export default function () {
  passport.use(
    "kakao-login",
    new KakaoStrategy(
      {
        clientID: process.env.KAKAO_KEY, // 카카오에서 발급받은 rest api 키
        callbackURL: "http://localhost:3010/api/log-in/kakao/callback", // 카카오 로그인 리디렉트 경로(로그인 후 카카오가 결과 전송할 url)
      },
      async (accessToken, refreshToken, profile, done) => {
        // 로그인 성공하면 카카오가 토큰을 보내주고, profile에는 카카오가 보내준 유저 정보 담겨있음
        // 가입 이력이 있으면 바로 done, 없으면 그자리에서 회원가입 후 done
      }
    )
  );
}
