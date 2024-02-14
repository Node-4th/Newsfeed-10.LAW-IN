import express from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";
const router = express.Router();

const existCheck = async (userId, propId, tableName, columnName) => {
  const isExist = await prisma[tableName].findFirst({
    where: {
      userId: userId,
      [columnName]: propId,
    },
  });
  console.log("isExist => ", isExist);
  return isExist;
};

const canceler = async (userId, propId, tableName, columnName) => {
  await prisma[tableName].delete({
    where: {
      [`userId_${columnName}`]: {
        userId: userId,
        [columnName]: propId,
      },
    },
  });
};

const creator = async (userId, propId, tableName, columnName) => {
  await prisma[tableName].create({
    data: {
      userId: userId,
      [columnName]: BigInt(propId),
    },
  });
};

const counter = async (propId, tableName, columnName) => {
  return await prisma[tableName].count({
    where: {
      [columnName]: propId,
    },
  });
};

const userUpdated = async (propId, tableName, columnName, count) => {
  return await prisma[tableName].update({
    where: {
      id: BigInt(propId),
    },
    data: {
      [columnName]: BigInt(count),
    },
  });
};

// const handleGood = async (userId, propId, tableName, tableName2, columnName, res,  , message) => {
//   console.log("isExist => ", isExist);

//   if (isExist) {
//     await prisma[tableName].delete({
//       where: {
//         [`userId_${columnName}`]: {
//           userId: userId,
//           [columnName]: propId,
//         },
//       },
//     });

//     const count = await prisma[tableName].count({
//       where: {
//         [columnName]: propId,
//       },
//     });
//     console.log("count => ", count);

//     const updatedUser = await prisma[tableName2].update({
//       where: {
//         id: BigInt(propId),
//       },
//       data: {
//         like: BigInt(count),
//       },
//     });
//     console.log("updatedUser => ", updatedUser);

//     return res.status(400).json({ errorMessage: message + "를 취소하였습니다." });
//   }

// await prisma[tableName].create({
//   data: {
//     userId: userId,
//     [columnName]: BigInt(propId),
//   },
// });

//   console.log("생성완료");

//   const count = await prisma[tableName].count({
//     where: {
//       [columnName]: propId,
//     },
//   });

//   console.log("count => ", count);

//   const updatedUser = await prisma[tableName2].update({
//     where: {
//       id: BigInt(propId),
//     },
//     data: {
//       like: BigInt(count),
//     },
//   });

//   console.log("updatedUser => ", updatedUser);

//   return res.status(201).json({ message: message + "가 추가 되었습니다." });
// };

// 좋아요
router.post("/boards/:boardId/comments/:commentsId/likes", AuthMiddleware, async (req, res) => {
  // 유저아이디 받아오기(좋아요 누를 인원 , 인증검사 진행후)
  const { id } = req.user;
  const commentsId = req.params.commentsId;

  const isExistLike = existCheck(id, commentsId, "liked", "likedCommentId");

  console.log("isExistLike => ", isExistLike);

  if (isExistLike) {
    canceler(id, commentsId, "liked", "likedCommentId");

    const count = counter(commentsId, "liked", "likedCommentsId");
    console.log("count => ", count);

    const updatedUser = userUpdated(commentsId, "liked", "like", count);
    console.log("updatedUser => ", updatedUser);

    return res.status(400).json({ errorMessage: "좋아요를 취소하였습니다." });
  }

  creator(id, commentsId, "liked", "likedCommentId");

  console.log("생성완료");

  const count = counter(commentsId, "liked", "likedCommentsId");
  console.log("count => ", count);

  const updatedUser = userUpdated(commentsId, "liked", "like", count);
  console.log("updatedUser => ", updatedUser);

  return res.status(201).json({ message: "좋아요가 추가 되었습니다." });
});

// 게시물 추천
router.post("/boards/:boardId/recommend", AuthMiddleware, async (req, res) => {
  // 유저아이디 받아오기(게시물추천 누를 인원 , 인증검사 진행후)
  const { id } = req.user;
  const boardId = req.params.boardId;

  handleGood(id, boardId, "recom", "boards", "recomedBoardId", res, "추천");

  // const isExistrecom = await prisma.recom.findFirst({
  //   where: {
  //     userId: id,
  //     recomedBoardId: boardId,
  //   },
  // });

  // console.log("isExistrecom => ", isExistrecom);

  // if (!isExistrecom) {
  //   await prisma.$transaction(async (tx) => {
  //     await tx.recom.create({
  //       data: {
  //         userId: id,
  //         recomedBoardId: BigInt(boardId),
  //       },
  //     });

  //     console.log("생성완료");

  //     const count = await tx.recom.count({
  //       where: {
  //         recomedBoardId: boardId,
  //       },
  //     });
  //     console.log("count => ", count);

  //     const updatedBoard = await tx.boards.update({
  //       where: {
  //         id: BigInt(boardId),
  //       },
  //       data: {
  //         recom: BigInt(count),
  //       },
  //     });

  //     console.log("updatedBoard => ", updatedBoard);
  //   });

  //   return res.status(201).json({ message: "추천 되었습니다." });
  // } else {
  //   await prisma.$transaction(async (tx) => {
  //     await tx.recom.delete({
  //       where: {
  //         userId_recomedBoardId: {
  //           userId: id,
  //           recomedBoardId: BigInt(boardId),
  //         },
  //       },
  //     });

  //     console.log("삭제완료");

  //     const count = await tx.recom.count({
  //       where: {
  //         recomedBoardId: boardId,
  //       },
  //     });
  //     console.log("count => ", count);

  //     const updatedBoard = await tx.boards.update({
  //       where: {
  //         id: BigInt(boardId),
  //       },
  //       data: {
  //         recom: BigInt(count),
  //       },
  //     });

  //     console.log("updatedBoard => ", updatedBoard);
  //   });

  //   return res.status(400).json({ errorMessage: "추천을 취소 하였습니다" });
  // }
});

//유저팔로우
router.post("/follow", AuthMiddleware, async (req, res) => {
  const { id } = req.user;
  const { followedId } = req.body;

  if (!followedId) {
    return res.status(400).json({ errorMessage: "팔로우하려는 유저의 ID를 작성해주세요" });
  }

  const user = await prisma.users.findFirst({
    where: {
      id: followedId,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "팔로우하려는 유저가 없습니다." });
  }

  if (id === user.id) {
    return res.status(404).json({ message: "유저는 유저 자신을 팔로우 할 수 없습니다." });
  }

  const follow = await prisma.follows.findFirst({
    where: {
      followerId: id,
      followedId: followedId,
    },
  });

  if (!follow) {
    await prisma.follows.create({
      data: {
        followerId: id,
        followedId: followedId,
      },
    });

    const count = await prisma.follows.count({
      where: {
        followedId: followedId,
      },
    });

    console.log(count);

    await prisma.users.update({
      where: {
        id: followedId,
      },
      data: {
        follow: count,
      },
    });

    return res.status(200).json({ message: "팔로우 하였습니다." });
  } else {
    await prisma.follows.delete({
      where: {
        followerId_followedId: {
          followerId: id,
          followedId: followedId,
        },
      },
    });

    const count = await prisma.follows.count({
      where: {
        followedId: followedId,
      },
    });

    console.log(count);

    await prisma.users.update({
      where: {
        id: followedId,
      },
      data: {
        follow: count,
      },
    });

    return res.status(200).json({ message: "팔로우 취소하였습니다." });
  }
});
export default router;
