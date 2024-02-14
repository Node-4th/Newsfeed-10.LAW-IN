import AWS from "aws-sdk";
// multer - 파일업로드를 위해 사용되는 multipart/form-data를 다루기 위한 node.js의 미들웨어
// multer를 거치면 req.file, req.files로 넘겨줌
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";

AWS.config.update({
  region: "ap-northeast-2", // AWS의 region 값
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // IAM에서 설정됐던 accessKeyId
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // IAM에서 설정됐던 secretAccessKey
});

const s3 = new AWS.S3();

const allowedExtensions = [".png", ".jpg", ".jpeg", ".bmp"];

const imageUploader = multer({
  storage: multerS3({
    s3: s3,
    bucket: "corinybucket", // 생성한 버킷 이름
    key: (req, file, callback) => {
      const uploadDirectory = req.query.directory ?? ""; // 업로드할 디렉토리를 설정하기 위해 넣어둔 코드로, 없어도 무관합니다.
      const extension = path.extname(file.originalname); // path라는 기본 패키지를 이용하여 extname으로 확장자를 추출하고, 허용하지 않는 확장자이면 에러생성
      if (!allowedExtensions.includes(extension)) {
        // extension 확인을 위한 코드로, 없어도 무관합니다.
        return callback(new Error("wrong extension"));
      }
      console.log("이쪽 들어오기는 함");
      console.log("uploadDirectory => ", uploadDirectory);
      console.log("extension => ", extension);
      callback(null, `${uploadDirectory}/${Date.now()}_${file.originalname}`);
      // 콜백함수의 두번째 인자로 들어가는 것은 업로드 경로
      // 경로에 / 를 포함하면 폴더를 자동으로 생성해줌
      // query에 디렉토리 값이 있으면 그 값을 받고없으면 디폴트 경로에 추가
    },
    acl: "public-read-write", //  s3 생성할 때 설정했던 권한 관련 설정
  }),
});

export default imageUploader;
