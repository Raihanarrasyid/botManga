const puppeteer = require("puppeteer-extra");
const stealth = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const pdf = require("pdfkit");
const axios = require("axios");
const sharp = require("sharp");

puppeteer.use(stealth());

async function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

exports.mangaToto = async () => {
  const url = "https://wto.to";
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(true);
  await page.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
  const seriesList = await page.$$(".col.item.line-b.no-flag");
  const Data = [];

  for (let i = 0; i < 10; i++) {
    const series = seriesList[i];
    const link = await series.$eval("a.item-cover", (anchor) => anchor.href);
    const imageUrl = await series.$eval("img.rounded", (img) => img.src);
    const title = await series.$eval("a.item-title", (title) =>
      title.textContent.trim()
    );
    const genres = await series.$$eval(".item-genre span", (spans) =>
      spans.map((span) => span.textContent.trim())
    );
    const volChapInfo = await series.$eval(".item-volch a.visited", (info) =>
      info.textContent.trim()
    );
    const chpUrl = await series.$eval(
      ".item-volch a.visited",
      (anchor) => anchor.href
    );
    const userInfo = await series.$eval(".item-volch i", (info) =>
      info.textContent.trim()
    );

    const data = {
      url: link,
      image: imageUrl,
      title,
      genre: genres.join(", "),
      chp: volChapInfo,
      chpUrl,
      updateAt: userInfo,
    };

    Data.push(data);
    console.log("URL:", link);
    console.log("Gambar:", imageUrl);
    console.log("Judul:", title);
    console.log("Genre:", genres.join(", "));
    console.log("Vol. & Ch.:", volChapInfo);
    console.log("Pengguna & Waktu:", userInfo);
    console.log("\n");
  }

  await browser.close();
  return Data;
};

const mangaTotoDownload = async (chapter) => {
  const url = "https://wto.to/chapter/" + chapter;
  const Datas = [];
  const browser = await puppeteer.launch({ headless: false });

  const page = await browser.newPage();
  await page.setJavaScriptEnabled(true);
  await page.goto(url, { waitUntil: "networkidle0" });

  try {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.setViewport({ width: bodyWidth, height: bodyHeight });

    const imgElements = await page.$$eval("#viewer .item .page-img", (els) => {
      return els.map((el) => el.src);
    });

    for (const el of imgElements) {
      Datas.push(el);
    }
  } catch (error) {
    console.log(error);
    return;
  } finally {
    browser.close();
  }

  const mangaPdf = new pdf();
  mangaPdf.pipe(fs.createWriteStream(`${chapter}.pdf`));
  for (let i = 0; i < Datas.length; i++) {
    const imgFormat = getImageFormat(Datas[i]);
    if (imgFormat === "webp") {
      await convertToJpeg(Datas[i], i);
      mangaPdf.image(`./download/${i}.jpeg`, { fit: [612, 792] });
      mangaPdf.addPage();
    } else if (imgFormat === "jpeg" || imgFormat === "png") {
      const base64Img = await downloadFile(Datas[i]);
      fs.writeFileSync(`./download/${i}.${imgFormat}`, base64Img, {
        encoding: "base64",
      });
      mangaPdf.image(`./download/${i}.${imgFormat}`, { fit: [612, 792] });
      mangaPdf.addPage();
    } else {
      console.log(`Gambar ${i} tidak memiliki format yang didukung.`);
    }
  }
  mangaPdf.end();

  return Datas.length;
};

const getImageFormat = (imageUrl) => {
  const supportedFormats = ["jpeg", "jpg", "png", "gif", "webp"];
  const ext = imageUrl.split(".").pop();
  if (supportedFormats.includes(ext.toLowerCase())) {
    return ext.toLowerCase();
  }
  return null;
};

const convertToJpeg = async (imageUrl, index) => {
  const base64Img = await downloadFile(imageUrl);
  const buffer = Buffer.from(base64Img, "base64");
  await sharp(buffer).jpeg().toFile(`./download/${index}.jpeg`);
};

exports.screenshot = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(true);
  await page.goto(url, { waitUntil: "networkidle0" });
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewport({ width: bodyWidth, height: bodyHeight });
  delay(5000);
  await page.screenshot({ path: "./image/image.jpg", fullPage: true });
  await browser.close();
};

const downloadFile = async (url) => {
  return axios
    .get(url, {
      responseType: "arraybuffer",
    })
    .then((response) =>
      Buffer.from(response.data, "binary").toString("base64")
    );
};

mangaTotoDownload("2751126");
