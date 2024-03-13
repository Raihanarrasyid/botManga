const pdf = require("pdfkit");
const fs = require("fs");

const mangaPdf = new pdf();
mangaPdf.pipe(fs.createWriteStream(`asep.pdf`));
try {
  mangaPdf.image(`./download/0.jpeg`);
} catch (error) {
  console.error("Error adding image to PDF:", error);
}
mangaPdf.end();
