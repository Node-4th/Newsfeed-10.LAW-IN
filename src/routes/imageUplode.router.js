import express from "express";
import imageUploader from "../s3/ImageUploader.js";

const router = express.Router();

router.post("/test/image", imageUploader.single("image"), (req, res) => {
  //single은 단일 이미지를 받을대 사용하는것, 여러 이미지를 받고 싶다면
  console.log("파일업로드하고 res.send로 가기 직전");
  res.send("good!");
});

export default router;
