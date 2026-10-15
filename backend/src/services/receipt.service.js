import PDFDocument from 'pdfkit';
import { getAppOrigin } from '../config/env.js';

/**
 * Generates an official, beautifully styled PDF receipt buffer using PDFKit.
 * @param {Object} receiptData
 * @param {string} receiptData.receiptNumber
 * @param {string} receiptData.orderId
 * @param {string} receiptData.studentName
 * @param {string} receiptData.studentEmail
 * @param {string} [receiptData.studentId]
 * @param {Array<{ title: string, instructorName?: string, productType?: string, finalPrice?: number, unitPrice?: number }>} receiptData.items
 * @param {number} receiptData.subtotal
 * @param {number} [receiptData.discount]
 * @param {number} [receiptData.couponDiscount]
 * @param {string} [receiptData.couponCode]
 * @param {number} [receiptData.credit]
 * @param {number} receiptData.finalAmount
 * @param {string} [receiptData.currency]
 * @param {string} [receiptData.provider]
 * @param {string} [receiptData.providerPaymentId]
 * @param {string} [receiptData.paymentMethod]
 * @param {Date|string} [receiptData.paidAt]
 * @param {string} [receiptData.courseUrl]
 * @returns {Promise<Buffer>}
 */
export function generateReceiptPdfBuffer(receiptData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Receipt - ${receiptData.receiptNumber || receiptData.orderId}`,
          Author: 'VStudyOnline',
          Subject: 'Course Purchase Confirmation & Official Receipt',
          Keywords: 'VStudyOnline, Receipt, Course, Enrollment, Payment',
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const currency = receiptData.currency || 'INR';
      const formattedDate = receiptData.paidAt
        ? new Date(receiptData.paidAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

      // ---- 1. Top Orange Brand Accent Bar ----
      doc.rect(0, 0, doc.page.width, 8).fill('#FA5A36');

      // ---- 2. Header Section ----
      let y = 35;
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#0F172A').text('VStudyOnline', 40, y);
      doc.fontSize(9).font('Helvetica').fillColor('#64748B').text('Global Learning Marketplace & Education Platform', 40, y + 25);

      // Status Badge (Right aligned)
      doc.roundedRect(doc.page.width - 150, y, 110, 26, 6).fill('#DCFCE7');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#166534').text('PAID (VERIFIED)', doc.page.width - 145, y + 7, {
        width: 100,
        align: 'center',
      });

      // Divider line
      y = 80;
      doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor('#E2E8F0').lineWidth(1).stroke();

      // Title
      y = 95;
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1E293B').text('OFFICIAL PAYMENT RECEIPT & ENROLLMENT INVOICE', 40, y);

      // ---- 3. Order & Customer Info Grid ----
      y = 125;
      const leftColX = 40;
      const rightColX = doc.page.width / 2 + 10;
      const boxWidth = (doc.page.width - 100) / 2;

      // Left Box: Transaction Details
      doc.roundedRect(leftColX, y, boxWidth, 115, 6).fillColor('#F8FAFC').fill().strokeColor('#E2E8F0').stroke();
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('TRANSACTION DETAILS', leftColX + 12, y + 10);
      
      doc.font('Helvetica').fontSize(9).fillColor('#64748B').text('Receipt Number:', leftColX + 12, y + 28);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(receiptData.receiptNumber || 'N/A', leftColX + 100, y + 28);

      doc.font('Helvetica').fillColor('#64748B').text('Order ID:', leftColX + 12, y + 44);
      doc.font('Helvetica').fillColor('#0F172A').text(receiptData.orderId || 'N/A', leftColX + 100, y + 44);

      doc.font('Helvetica').fillColor('#64748B').text('Date & Time:', leftColX + 12, y + 60);
      doc.font('Helvetica').fillColor('#0F172A').text(formattedDate, leftColX + 100, y + 60);

      doc.font('Helvetica').fillColor('#64748B').text('Payment Gateway:', leftColX + 12, y + 76);
      doc.font('Helvetica').fillColor('#0F172A').text(receiptData.provider || 'CASHFREE', leftColX + 100, y + 76);

      doc.font('Helvetica').fillColor('#64748B').text('Reference ID:', leftColX + 12, y + 92);
      doc.font('Helvetica').fillColor('#0F172A').text(receiptData.providerPaymentId || receiptData.providerOrderId || 'Verified', leftColX + 100, y + 92);

      // Right Box: Student Details
      doc.roundedRect(rightColX, y, boxWidth, 115, 6).fillColor('#F8FAFC').fill().strokeColor('#E2E8F0').stroke();
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('BILLED TO (STUDENT)', rightColX + 12, y + 10);

      doc.font('Helvetica').fontSize(9).fillColor('#64748B').text('Student Name:', rightColX + 12, y + 28);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(receiptData.studentName || 'Student', rightColX + 90, y + 28);

      doc.font('Helvetica').fillColor('#64748B').text('Email:', rightColX + 12, y + 44);
      doc.font('Helvetica').fillColor('#0F172A').text(receiptData.studentEmail || 'N/A', rightColX + 90, y + 44);

      doc.font('Helvetica').fillColor('#64748B').text('Account ID:', rightColX + 12, y + 60);
      doc.font('Helvetica').fillColor('#0F172A').text(receiptData.studentId ? String(receiptData.studentId) : 'Registered Student', rightColX + 90, y + 60);

      doc.font('Helvetica').fillColor('#64748B').text('Payment Status:', rightColX + 12, y + 76);
      doc.font('Helvetica-Bold').fillColor('#166534').text('COMPLETED / SUCCESS', rightColX + 90, y + 76);

      // ---- 4. Itemized Purchases Table ----
      y = 260;
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text('ENROLLED COURSES & PURCHASES', 40, y);

      y += 18;
      const tableWidth = doc.page.width - 80;
      // Header row
      doc.roundedRect(40, y, tableWidth, 24, 4).fillColor('#0F172A').fill();
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
      doc.text('COURSE / PRODUCT DESCRIPTION', 50, y + 7);
      doc.text('INSTRUCTOR', 300, y + 7);
      doc.text('TYPE', 410, y + 7);
      doc.text(`AMOUNT (${currency})`, doc.page.width - 130, y + 7, { width: 80, align: 'right' });

      y += 24;
      const items = receiptData.items && receiptData.items.length > 0
        ? receiptData.items
        : [{ title: 'Course Enrollment', instructorName: 'Platform Faculty', productType: 'COURSE', finalPrice: receiptData.finalAmount }];

      items.forEach((item, index) => {
        const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, y, tableWidth, 32).fillColor(rowBg).fill().strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1E293B').text(item.title || 'Course Enrollment', 50, y + 6, {
          width: 240,
          ellipsis: true,
        });

        doc.font('Helvetica').fontSize(8.5).fillColor('#64748B').text(item.instructorName || 'Platform Instructor', 300, y + 8, {
          width: 100,
          ellipsis: true,
        });

        doc.font('Helvetica').fontSize(8.5).fillColor('#64748B').text(item.productType || 'COURSE', 410, y + 8);

        const itemPrice = Number(item.finalPrice ?? item.unitPrice ?? item.price ?? receiptData.finalAmount);
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A').text(
          `${currency} ${itemPrice.toLocaleString('en-IN')}`,
          doc.page.width - 130,
          y + 8,
          { width: 80, align: 'right' }
        );

        y += 32;
      });

      // ---- 5. Financial Summary Box ----
      y += 10;
      const summaryWidth = 240;
      const summaryX = doc.page.width - 40 - summaryWidth;

      doc.roundedRect(summaryX, y, summaryWidth, 110, 6).fillColor('#F8FAFC').fill().strokeColor('#E2E8F0').stroke();

      let sumY = y + 10;
      doc.font('Helvetica').fontSize(9).fillColor('#64748B').text('Subtotal:', summaryX + 14, sumY);
      doc.font('Helvetica').fillColor('#0F172A').text(`${currency} ${(receiptData.subtotal || receiptData.finalAmount).toLocaleString('en-IN')}`, summaryX + 130, sumY, { width: 95, align: 'right' });

      sumY += 18;
      const totalDiscount = (receiptData.discount || 0) + (receiptData.couponDiscount || 0);
      if (totalDiscount > 0) {
        doc.font('Helvetica').fillColor('#166534').text(`Discount ${receiptData.couponCode ? `(${receiptData.couponCode})` : ''}:`, summaryX + 14, sumY);
        doc.font('Helvetica').fillColor('#166534').text(`-${currency} ${totalDiscount.toLocaleString('en-IN')}`, summaryX + 130, sumY, { width: 95, align: 'right' });
        sumY += 18;
      }

      if (receiptData.credit && receiptData.credit > 0) {
        doc.font('Helvetica').fillColor('#166534').text('Credit Applied:', summaryX + 14, sumY);
        doc.font('Helvetica').fillColor('#166534').text(`-${currency} ${receiptData.credit.toLocaleString('en-IN')}`, summaryX + 130, sumY, { width: 95, align: 'right' });
        sumY += 18;
      }

      // Final Total Divider
      doc.moveTo(summaryX + 10, sumY).lineTo(summaryX + summaryWidth - 10, sumY).strokeColor('#CBD5E1').lineWidth(1).stroke();
      sumY += 8;

      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text('Total Paid:', summaryX + 14, sumY);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#FA5A36').text(
        `${currency} ${receiptData.finalAmount.toLocaleString('en-IN')}`,
        summaryX + 100,
        sumY,
        { width: 125, align: 'right' }
      );

      // ---- 6. Course Access Information Box ----
      const leftNoteWidth = summaryX - 50;
      doc.roundedRect(40, y, leftNoteWidth, 110, 6).fillColor('#FFF7ED').fill().strokeColor('#FDBA74').stroke();

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#C2410C').text('ONE-CLICK COURSE ACCESS', 52, y + 10);
      doc.font('Helvetica').fontSize(8.5).fillColor('#7C2D12').text(
        'Your course access has been activated immediately. Log in to your student dashboard to stream video lessons, access assessments, and download study resources.',
        52,
        y + 26,
        { width: leftNoteWidth - 24, lineGap: 3 }
      );

      const targetUrl = receiptData.courseUrl || `${getAppOrigin()}/dashboard/student`;
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#C2410C').text(
        `Dashboard: ${targetUrl}`,
        52,
        y + 72,
        { width: leftNoteWidth - 24, ellipsis: true }
      );

      // ---- 7. Footer & Authenticity Notice ----
      const footerY = doc.page.height - 70;
      doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

      doc.font('Helvetica').fontSize(8).fillColor('#94A3B8').text(
        'This is a computer-generated official receipt issued by VStudyOnline Global Learning Marketplace. No physical signature is required.',
        40,
        footerY + 10,
        { align: 'center', width: doc.page.width - 80 }
      );
      doc.font('Helvetica').fontSize(8).fillColor('#94A3B8').text(
        `Generated on ${new Date().toUTCString()} • Support: support@vstudyonline.com • Thank you for learning with us!`,
        40,
        footerY + 22,
        { align: 'center', width: doc.page.width - 80 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
