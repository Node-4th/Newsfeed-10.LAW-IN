import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwtwebToken from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

//회원가입
router.post('/sign-up', async (req, res) => {
  const { id, email, password, passwordCheck, nickname, content } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: 'id를 입력해주세요.' });
  }

  if (!email) {
    return res.status(400).json({ success: false, message: 'email을 입력해주세요.' });
  }

  if (!password) {
    return res.status(400).json({ success: false, message: 'password를 입력해주세요.' });
  }

  if (!passwordCheck) {
    return res.status(400).json({ success: false, message: 'passwordCheck를 입력해주세요.' });
  }

  if (!nickname) {
    return res.status(400).json({ success: false, message: 'nickname을 입력해주세요.' });
  }
  if (!content) {
    return res.status(400).json({ success: false, message: 'content를 입력해주세요.' });
  }

  if (password.id < 6) {
    return res.status(400).json({ success: false, meessage: '비밀번호는 최소 6자 이상입니다.' });
  }

  if (password !== passwordCheck) {
    return res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
  }

  const user = await prisma.users.findFirst({
    where: {
      id,
      password,
    },
  });
  if (user) {
    return res.status(400).json({ success: false, message: '올바르지 않는 로그인 정보입니다.' });
  }

  await prisma.users.create({
    data: {
      id,
      email,
      password,
      nickname,
      content,
    },
  });

  const userInfo = await prisma.users.findFirst({
    where: {
      id,
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
  return res.status(201).json({ userInfo: userInfo });
});

//회원탈퇴
router.delete('/sign-out', async (req, res) => {
const token = req.headers.authorization;

if(!token){
  return res.status(401).json({success: false, message : '인증되지 않은 요청입니다.'})
}
try {
  const decodedToken = jwt.verify(token, 'lawin_secret_key')
}

})
  




//로그인
router.post('/log-in', async (req, res) => {
  const { id, password } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: 'id를 입력해주세요.' });
  }
  if (!password) {
    return res.status(400).json({ succes: false, message: 'password를 입력해주세요.' });
  }

  const user = await prisma.users.findFirst({
    where: {
      id,
      password,
    },
  });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Id와 password가 일치하지 않습니다.' });
  }

  //로그인 성공
  const accessToken = jwtwebToken.sign({ id: id }, 'lawin_secret_key', { expiresIn: '1h' });
  return res.status(200).json({ accessToken, message: '로그인에 성공하였습니다.' });
});

export default router;
