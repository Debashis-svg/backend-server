// server/controllers/certificate.controller.js
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs/promises');
const path = require('path');
const Certificate = require('../models/Certificate.model');

exports.downloadCertificate = async (req, res) => {
  try {
    // 1. Get the team's certificate data (using the teamId from auth)
    const certificateData = await Certificate.findOne({ team: req.teamId });

    if (!certificateData) {
      return res.status(404).json({ message: "Certificate not yet issued for your team." });
    }

    // 2. Load the PDF template from disk
    const templatePath = path.resolve(__dirname, '../templates/template.pdf');
    const pdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // 3. Embed built-in fonts
    let titleFont, bodyFont;
    try {
      titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    } catch {
      titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    }
    try {
      bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    } catch {
      bodyFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    }

    // 4. Get the first page
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();

    // --- Team Name ---
    const teamName = certificateData.teamName;
    const teamNameSize = 32;
    const teamNameWidth = titleFont.widthOfTextAtSize(teamName, teamNameSize);
    firstPage.drawText(teamName, {
      x: (width - teamNameWidth) / 2,
      y: height / 2+10, // ✅ X and Y kept as-is
      size: teamNameSize,
      font: titleFont,
      color: rgb(0,0,0), 
    });

    // --- Achievement (Below the name) ---
    const achievement = certificateData.achievement;
    const achievementSize = 24;
    const achievementWidth = bodyFont.widthOfTextAtSize(achievement, achievementSize);
    firstPage.drawText(achievement, {
      x: (width - achievementWidth) / 2,
      y: height / 2 - 65, // ✅ same Y offset retained
      size: achievementSize,
      font: titleFont,
      color: rgb(0.93, 0.68, 0.13), // golden accent
    });

    // --- Verification ID (Bottom Right) ---
    const verificationText = `Verification ID: ${certificateData.verificationId}`;
    const verificationSize = 10;
    const verificationWidth = bodyFont.widthOfTextAtSize(verificationText, verificationSize);
    firstPage.drawText(verificationText, {
      x: width - verificationWidth - 26, // ✅ same alignment kept
      y: 33, // ✅ same bottom offset kept
      size: verificationSize,
      font: bodyFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // 5. Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // 6. Send the PDF file as a download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate_${certificateData.teamName}.pdf"`
    );
    res.send(Buffer.from(modifiedPdfBytes));
  } catch (error) {
    console.error("Certificate download error:", error);
    res.status(500).json({ message: "Error generating certificate." });
  }
};
