const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");

admin.initializeApp();
const db = admin.firestore();

exports.crawlSoftcon = functions.https.onRequest(async (req, res) => {
  const uid = req.query.uid || "1803";
  const term = req.query.term || "2024-1";
  const url = `https://softcon.ajou.ac.kr/works/works_prev.asp?uid=${uid}&wTerm=${term}`;

  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const title = $("div.cont_view h3.tit_type01").text().trim();
    const summary = $("div.cont_view div.txt_view").text().trim();
    const gitRepository = $("a[href*='github.com']").attr("href") || "";
    const presentationUrl = $("a[href$='.pdf']").attr("href") || "";
    const videoUrl = $("iframe").attr("src") || "";
    const representativeImage = $("div.img_registrant img").attr("src") || "https://softcon.ajou.ac.kr/images/no_registrant.jpg";

    const teamInfo = [];
    $("div.team_view ul li").each((i, el) => {
      const role = $(el).find("span.txt_role").text().trim();
      const name = $(el).find("span.name").text().trim();
      const dept = $(el).find("span.major").text().trim();
      const grade = $(el).find("span.grade").text().trim();
      const email = $(el).find("span.email").text().trim();
      if (role && name) {
        teamInfo.push({ role, name, department: dept, grade, email });
      }
    });

    const mentor = {
      name: $("div.mentor_view span.name").text().trim(),
      affiliation: $("div.mentor_view span.aff").text().trim(),
    };

    const docData = {
      uid,
      term,
      title,
      summary,
      gitRepository,
      presentationUrl,
      videoUrl,
      representativeImage: representativeImage.startsWith("http")
        ? representativeImage
        : "https://softcon.ajou.ac.kr" + representativeImage,
      teamInfo,
      mentor,
      crawledAt: new Date(),
    };

    await db.collection("portfolios").doc(uid).set(docData);

    res.send({ message: "크롤링 성공", uid, title });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "크롤링 실패", error: err.message });
  }
});
