import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import exphbs from "express-handlebars";
import LogMiddleware from "./src/middlewares/log.middleware.js";
import ErrorHandlingMiddleware from "./src/middlewares/error-handling.middleware.js";
import UserRouter from "./src/routes/user.router.js";
import BoardRouter from "./src/routes/board.router.js";
import CommentRouter from "./src/routes/comment.router.js";
import FeatureRouter from "./src/routes/features.router.js";
import AdminRouter from "./src/routes/admin.router.js";
import handlebarHelper from "./helpers/handlebars-helpers.js";

dotenv.config();

const app = express();
const PORT = 3010;

app.engine("hbs", exphbs.engine({ helpers: handlebarHelper, extname: "hbs" }));
app.set("view engine", "hbs");

app.get("/", (req, res) => {
  return res.redirect("/api/boards");
});

app.use(express.static("views")); // 정적파일을 읽어오기 위한 static
app.use(LogMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api", [UserRouter, BoardRouter, CommentRouter, FeatureRouter, AdminRouter]);
app.use(ErrorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT + "포트로 서버가 시작되었습니다.");
});
