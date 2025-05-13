// controllers/terms.js
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { TERMS, CATEGORIES } = require("../config/constants");

// 소프트콘 학기 및 카테고리 정보 반환 함수
exports.getSoftconTerms = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.json({
      terms: TERMS,
      categories: CATEGORIES
    });
  });
});