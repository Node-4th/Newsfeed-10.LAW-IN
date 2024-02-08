import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import LogMiddleware from "./src/middlewares/log.middleware.js";
import ErrorHandlingMiddleware from "./src/middlewares/error-handling.middleware.js";
import UserRouter from "./src/routes/user.router.js";
import BoardRouter from "./src/routes/board.router.js";
import CommentRouter from "./src/routes/comment.router.js";
import AdminRouter from "./src/routes/admin.router.js";

dotenv.config();

const app = express();
const PORT = 3010;
app.get("/", (req, res) => {
  return res.status(200).json({ message: "진입성공" });
});
app.use(LogMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use("/api", [UserRouter, BoardRouter, CommentRouter, AdminRouter]);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT + "포트로 서버가 시작되었습니다.");
});
