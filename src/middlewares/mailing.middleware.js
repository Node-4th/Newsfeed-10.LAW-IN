import mailer from "nodemailer";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

export default async function (req, res, next) {
  const { email } = req.body;
  // 인증 이메일 전송
  const authCode = Math.random().toString(36).substring(2, 8);
  const hashedCode = await bcrypt.hash(authCode, 10);

  if (!email || !authCode) {
    return res.status(400).json({ message: "이메일이 입력되지 않았습니다." });
  }

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
    const smtpTransport = mailer.createTransport({
      pool: true,
      maxConnections: 1,
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
        return res.status(500).json({ message: "인증 메일 전송에 실패했습니다." });
      } else {
        console.log("이메일 전송 성공.");
        smtpTransport.close();
        resolve();
      }
    });
  };

  try {
    sendEmail(email, authCode);

    // 일단 해싱해서 쿠키에 저장 (더 나은 방법이 있다면 고쳐주세요)
    res.cookie("authCode", hashedCode, { maxAge: 3600000 });
    next();
  } catch (err) {
    next(err);
  }
}
