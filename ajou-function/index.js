const functions = require("firebase-functions");
const { exec } = require("child_process");

// Python 스크립트를 실행하는 함수
exports.runCrawlingScript = functions.https.onRequest((req, res) => {
  exec("python3 /path/to/your_script.py", (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      res.status(500).send(`Stderr: ${stderr}`);
      return;
    }
    res.status(200).send(`Success: ${stdout}`);
  });
});
