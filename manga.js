const puppeteer = require('puppeteer-extra');
const stealth = require("puppeteer-extra-plugin-stealth");
const fs = require('fs');
const pdf = require("pdfkit");
const { default: axios } = require('axios');
const { Browser } = require('puppeteer');
const downloadFile = (url) => {
  return axios
    .get(url, {
      responseType: "text",
      responseEncoding : "base64"
    })
    .then(response => response.data)
}


puppeteer.use(stealth());

function delay(time) {
    return new Promise(function(resolve) {
    setTimeout(resolve, time)
    });
}

exports.mangaToto = async () => {
    const url = "https://wto.to"
    const browser = await puppeteer.launch({headless : true});

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);
    await page.goto(url, {waitUntil : 'networkidle0', timeout : 20000});
    //Ambil data dari w.toto
    const seriesList = await page.$$('.col.item.line-b.no-flag');
    const Data = []

  for (let i = 0; i < 10; i++) {
    const series = seriesList[i];
    // Ambil URL dan gambar
    const link = await series.$eval('a.item-cover', anchor => anchor.href);
    const imageUrl = await series.$eval('img.rounded', img => img.src);

    // Ambil judul
    const title = await series.$eval('a.item-title', title => title.textContent.trim());

    // Ambil genre
    const genres = await series.$$eval('.item-genre span', spans => spans.map(span => span.textContent.trim()));

    // Ambil informasi volume dan chapter
    const volChapInfo = await series.$eval('.item-volch a.visited', info => info.textContent.trim());

    //Ambil Informasi link chapter
    const chpUrl = await series.$eval('.item-volch a.visited', anchor => anchor.href);


    // Ambil informasi pengguna dan waktu
    const userInfo = await series.$eval('.item-volch i', info => info.textContent.trim());

    // isi hasil ke data
    let data = {
        url : link,
        image : imageUrl,
        title,
        genre : genres.join(", "),
        chp : volChapInfo,
        chpUrl,
        updateAt : userInfo
    }

    Data.push(data);
    // Tampilkan hasil
    console.log('URL:', link);
    console.log('Gambar:', imageUrl);
    console.log('Judul:', title);
    console.log('Genre:', genres.join(', '));
    console.log('Vol. & Ch.:', volChapInfo);
    console.log('Pengguna & Waktu:', userInfo);
    console.log('\n');
  }

    await browser.close()
    return Data;
}

const mangaTotoDownload = async (chapter) => {
    const url = "https://wto.to/chapter/" + chapter;
    const Datas = [];
    const browser = await puppeteer.launch({headless : false});
  
      console.log("buat page")
      const page = await browser.newPage();
      console.log("selesai buat page")
      await page.setJavaScriptEnabled(true);
      console.log("menuju page")
      await page.goto(url, {waitUntil : 'networkidle0'});
    try {
      console.log("Scrolll")
      // Get scroll width and height of the rendered page and set viewport
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      await page.setViewport({ width: bodyWidth, height: bodyHeight });
      console.log("selesai Scroll")
      console.log("mengambil data")
      // Menggunakan selector untuk mendapatkan elemen gambar dengan class "page-img"
      const imgElements = await page.$$eval("#viewer .item .page-img", (els) => {
        return els.map( el => el.src)
      })
      console.log("data selesai diambil")
      for(const el of imgElements){
        Datas.push(el)
      }
      // console.log(imgElements)
    }catch (error) {
      console.log(error);
      return;
    }finally{
      browser.close();
    }
    
    const mangaPdf = new pdf;
    mangaPdf.pipe(fs.createWriteStream(`${chapter}.pdf`))
    for(let i = 0; i < Datas.length; i++){
      const base64Img = await downloadFile(Datas[i]);
      fs.writeFileSync(`./download/${i}.jpeg`, base64Img, {encoding : "base64"})
      console.log(base64Img)
      // mangaPdf.image(`data:image/png;base64,${base64Img}`);
      
    }
    mangaPdf.end()

    return Datas.length
}

exports.screenshot = async (url) => {
    const browser = await puppeteer.launch({headless : true});

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);
    await page.goto(url, {waitUntil : 'networkidle0'});

    // Get scroll width and height of the rendered page and set viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.setViewport({ width: bodyWidth, height: bodyHeight });

    delay(5000)
    await page.screenshot({path : "./image/image.jpg", fullPage : true});

    await browser.close()
}

mangaTotoDownload("2751126")