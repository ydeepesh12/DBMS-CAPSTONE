const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

async function generateReceiptPdf(challanData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Verification QR data
      const qrData = JSON.stringify({
        challanNumber: challanData.challan_number,
        receiptNumber: challanData.receipt_number || 'RCP-VERIFIED',
        amount: challanData.amount_paid || challanData.total_amount,
        txnRef: challanData.transaction_reference,
        vehicle: challanData.registration_no,
        date: challanData.payment_date || new Date().toISOString()
      });

      const qrImageBuffer = await QRCode.toBuffer(qrData, { width: 120, margin: 1 });

      // Colors
      const navy = '#0f172a';
      const saffron = '#d97706';
      const gray = '#475569';
      const lightBg = '#f8fafc';

      // Header Banner
      doc.rect(40, 40, 515, 60).fill(navy);
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
         .text('SMARTCHALLAN TRAFFIC MANAGEMENT SYSTEM', 50, 52, { align: 'center', width: 495 });
      doc.fontSize(10).font('Helvetica')
         .text('Ministry of Road Transport & Highways | Integrated E-Challan Portal', 50, 75, { align: 'center', width: 495 });

      // Receipt Title & Subtitle
      doc.moveDown(2);
      doc.fillColor(saffron).fontSize(14).font('Helvetica-Bold')
         .text('OFFICIAL E-CHALLAN PAYMENT RECEIPT', 40, 115, { align: 'center' });
      doc.fillColor(gray).fontSize(9).font('Helvetica')
         .text('Issued under Section 133A of the Motor Vehicles Act, 1988', 40, 132, { align: 'center' });

      // Status Badge
      doc.rect(225, 150, 145, 24).fillAndStroke('#ecfdf5', '#10b981');
      doc.fillColor('#065f46').fontSize(10).font('Helvetica-Bold')
         .text('PAYMENT COMPLETED', 225, 157, { align: 'center', width: 145 });

      // Summary Table Layout
      let y = 190;
      doc.rect(40, y, 515, 80).fill(lightBg).stroke('#e2e8f0');

      doc.fillColor(navy).fontSize(10).font('Helvetica-Bold');
      doc.text('Receipt No:', 55, y + 15);
      doc.text('Challan No:', 55, y + 35);
      doc.text('Payment Date:', 55, y + 55);

      doc.font('Helvetica').fillColor(gray);
      doc.text(challanData.receipt_number || 'N/A', 150, y + 15);
      doc.text(challanData.challan_number || 'N/A', 150, y + 35);
      doc.text(challanData.payment_date ? new Date(challanData.payment_date).toLocaleString() : new Date().toLocaleString(), 150, y + 55);

      doc.font('Helvetica-Bold').fillColor(navy);
      doc.text('Txn Reference:', 310, y + 15);
      doc.text('Payment Mode:', 310, y + 35);
      doc.text('Gateway Status:', 310, y + 55);

      doc.font('Helvetica').fillColor(gray);
      doc.text(challanData.transaction_reference || 'ONLINE-GATEWAY', 410, y + 15);
      doc.text(challanData.payment_method || 'UPI / Gateway', 410, y + 35);
      doc.fillColor('#059669').font('Helvetica-Bold').text('SUCCESS', 410, y + 55);

      // Vehicle & Offender Section
      y += 100;
      doc.fillColor(navy).fontSize(12).font('Helvetica-Bold').text('1. Vehicle & Owner Particulars', 40, y);
      doc.rect(40, y + 18, 515, 65).fill('#ffffff').stroke('#cbd5e1');

      doc.fontSize(9).font('Helvetica-Bold').fillColor(navy);
      doc.text('Registration No:', 55, y + 28);
      doc.text('Vehicle Details:', 55, y + 46);
      doc.text('Registered Owner:', 55, y + 64);

      doc.font('Helvetica').fillColor(gray);
      doc.text(challanData.registration_no || 'N/A', 165, y + 28);
      doc.text(`${challanData.make_model || 'Light Motor Vehicle'} (${challanData.vehicle_type || 'CAR'})`, 165, y + 46);
      doc.text(challanData.owner_name || 'N/A', 165, y + 64);

      doc.font('Helvetica-Bold').fillColor(navy);
      doc.text('Chassis / Engine:', 330, y + 28);
      doc.text('Owner Contact:', 330, y + 46);

      doc.font('Helvetica').fillColor(gray);
      doc.text(challanData.chassis_no || 'VERIFIED ON RECORD', 430, y + 28);
      doc.text(challanData.owner_phone || '+91-XXXXXXXXXX', 430, y + 46);

      // Violation Particulars Section
      y += 100;
      doc.fillColor(navy).fontSize(12).font('Helvetica-Bold').text('2. Traffic Violation Details', 40, y);
      doc.rect(40, y + 18, 515, 65).fill('#ffffff').stroke('#cbd5e1');

      doc.fontSize(9).font('Helvetica-Bold').fillColor(navy);
      doc.text('Offense Description:', 55, y + 28);
      doc.text('Statutory Act & Sec:', 55, y + 46);
      doc.text('Location of Event:', 55, y + 64);

      doc.font('Helvetica').fillColor(gray);
      doc.text(challanData.violation_title || 'Traffic Infraction', 165, y + 28);
      doc.text(challanData.section_act || 'Motor Vehicles Act', 165, y + 46);
      doc.text(`${challanData.area_name || 'Zone'}, ${challanData.junction_name || 'City'}`, 165, y + 64);

      // Financial Breakdown Section
      y += 100;
      doc.fillColor(navy).fontSize(12).font('Helvetica-Bold').text('3. Fine Calculation & Settlement', 40, y);
      
      doc.rect(40, y + 18, 360, 90).fill('#ffffff').stroke('#cbd5e1');
      doc.fontSize(9).font('Helvetica').fillColor(gray);
      doc.text('Base Statutory Fine:', 55, y + 30);
      doc.text('Compounding / Late Penalty:', 55, y + 50);
      doc.text('Administrative Convenience Fee:', 55, y + 70);

      doc.font('Helvetica-Bold').fillColor(navy);
      doc.text(`INR ${parseFloat(challanData.fine_amount || 0).toFixed(2)}`, 280, y + 30, { align: 'right', width: 100 });
      doc.text(`INR ${parseFloat(challanData.late_fee || 0).toFixed(2)}`, 280, y + 50, { align: 'right', width: 100 });
      doc.text(`INR 0.00`, 280, y + 70, { align: 'right', width: 100 });

      // Total Box
      doc.rect(40, y + 88, 360, 25).fill(navy);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
      doc.text('NET AMOUNT SETTLED:', 55, y + 95);
      doc.text(`INR ${parseFloat(challanData.total_amount || challanData.amount_paid || 0).toFixed(2)}`, 280, y + 95, { align: 'right', width: 100 });

      // QR Code Box on right
      doc.rect(415, y + 18, 140, 95).fill('#ffffff').stroke('#cbd5e1');
      doc.image(qrImageBuffer, 425, y + 22, { width: 85 });
      doc.fillColor(gray).fontSize(7).font('Helvetica')
         .text('Scan with any UPI / E-Gov app to verify authenticity', 418, y + 98, { width: 134, align: 'center' });

      // Footer
      doc.fontSize(8).fillColor('#64748b').font('Helvetica')
         .text('This is a computer-generated official receipt and requires no physical ink signature. Issued by Department of Traffic Enforcement.', 40, 750, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateReceiptPdf
};
