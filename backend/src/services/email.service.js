import nodemailer from 'nodemailer';
import '../config/env.js';
import { getAppOrigin } from '../config/env.js';
export { getAppOrigin };

let transporterInstance = null;

function getTransporter() {
  if (transporterInstance) return transporterInstance;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  // In Nodemailer: secure = false on port 587 enables STARTTLS (matching HR-Recruitment-Agent)
  // secure = true is only for legacy implicit SSL on port 465
  const secure = process.env.SMTP_SECURE === 'true' || (port === 465 && process.env.SMTP_SECURE !== 'false');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('SMTP credentials are required. Configure SMTP_USER and SMTP_APP_PASSWORD.');
  }

  transporterInstance = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporterInstance;
}

export async function verifyEmailConnection() {
  const transporter = getTransporter();
  await transporter.verify();
  return true;
}

export async function sendEmail({ to, subject, html, text, attachments }) {
  if (!to || !subject || (!html && !text)) {
    throw new Error('Recipient, subject, and email content are required.');
  }

  const transporter = getTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || 'VStudyOnline';
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER;

  const mailOptions = {
    from: {
      name: fromName,
      address: fromAddress,
    },
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ' '),
  };

  if (Array.isArray(attachments) && attachments.length > 0) {
    mailOptions.attachments = attachments;
  }

  const smtpResult = await transporter.sendMail(mailOptions);
  console.log(`[EmailService] Delivered email to ${to} via SMTP (MessageId: ${smtpResult.messageId})`);
  return { ...smtpResult, provider: 'smtp' };
}

/**
 * 1. Course Purchase Confirmation Email (Student) with Official Itemized Receipt & PDF Attachment
 */
export async function sendCoursePurchaseEmail({
  studentEmail,
  studentName,
  courseTitle,
  instructorName = 'VStudyOnline Faculty',
  receiptNumber,
  providerPaymentId,
  paymentMethod = 'Cashfree Gateway',
  amount,
  subtotal,
  discount = 0,
  couponCode,
  credit = 0,
  currency = 'INR',
  orderId,
  orderDate,
  courseUrl,
  pdfBuffer,
}) {
  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleDateString('en-IN', {
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

  const appOrigin = getAppOrigin();
  const targetUrl = courseUrl || `${appOrigin}/dashboard/student`;
  const computedSubtotal = subtotal != null ? subtotal : amount;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .brand-bar { height: 6px; background: #FA5A36; width: 100%; }
    .header { background: #0f172a; padding: 32px 28px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; padding: 6px 14px; background: rgba(34, 197, 94, 0.2); color: #4ade80; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .receipt-id-tag { font-size: 13px; color: #94a3b8; margin-top: 6px; font-family: monospace; }
    .content { padding: 32px 28px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin: 20px 0 8px; }
    .invoice-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; color: #475569; }
    .row:last-child { border-bottom: none; }
    .row-val { font-weight: 600; color: #0f172a; text-align: right; }
    .total-row { padding-top: 12px; border-top: 2px solid #cbd5e1; font-weight: 700; color: #0f172a; font-size: 15px; }
    .btn { display: block; text-align: center; background: #FA5A36; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; margin: 26px 0 16px; font-size: 15px; }
    .pdf-callout { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #166534; display: flex; align-items: center; }
    .footer { padding: 22px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; background: #f8fafc; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand-bar"></div>
    <div class="header">
      <div class="badge">&#10003; Payment Verified &bull; Enrolled</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">Course Purchase Confirmed</h1>
      <div class="receipt-id-tag">Receipt #${receiptNumber || orderId}</div>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0; color: #1e293b;">Hello <strong>${studentName || 'Student'}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 22px;">
        Thank you for learning with us! Your payment has been successfully processed and verified. Full access to your course materials and video lectures is now unlocked.
      </p>

      <div class="section-title">Purchase & Enrollment Details</div>
      <div class="invoice-box">
        <div class="row">
          <span>Course Title</span>
          <span class="row-val">${courseTitle}</span>
        </div>
        <div class="row">
          <span>Lead Instructor</span>
          <span class="row-val">${instructorName}</span>
        </div>
        <div class="row">
          <span>Receipt Number</span>
          <span class="row-val">${receiptNumber || 'N/A'}</span>
        </div>
        <div class="row">
          <span>Order ID</span>
          <span class="row-val">${orderId}</span>
        </div>
        <div class="row">
          <span>Transaction Ref (Cashfree)</span>
          <span class="row-val">${providerPaymentId || 'Verified'}</span>
        </div>
        <div class="row">
          <span>Date of Purchase</span>
          <span class="row-val">${formattedDate}</span>
        </div>
        <div class="row">
          <span>Payment Gateway</span>
          <span class="row-val">${paymentMethod}</span>
        </div>
      </div>

      <div class="section-title">Financial Breakdown</div>
      <div class="invoice-box">
        <div class="row">
          <span>Course Fee</span>
          <span class="row-val">${currency} ${computedSubtotal.toLocaleString('en-IN')}</span>
        </div>
        ${
          discount > 0
            ? `<div class="row" style="color: #166534;">
                <span>Discount Applied ${couponCode ? `(${couponCode})` : ''}</span>
                <span class="row-val" style="color: #166534;">-${currency} ${discount.toLocaleString('en-IN')}</span>
               </div>`
            : ''
        }
        ${
          credit > 0
            ? `<div class="row" style="color: #166534;">
                <span>Topic Credit Applied</span>
                <span class="row-val" style="color: #166534;">-${currency} ${credit.toLocaleString('en-IN')}</span>
               </div>`
            : ''
        }
        <div class="row total-row">
          <span style="color: #0f172a;">Total Paid</span>
          <span class="row-val" style="color: #FA5A36; font-size: 16px;">${currency} ${amount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      ${
        pdfBuffer
          ? `<div class="pdf-callout">
               <span><strong>&#128196; Official PDF Receipt Attached:</strong> A formal tax invoice and payment receipt (<code>Receipt-${receiptNumber || orderId}.pdf</code>) is attached to this email for your accounting and tax records.</span>
             </div>`
          : ''
      }

      <a href="${targetUrl}" class="btn">Access Your Course Now &rarr;</a>

      <p style="font-size: 12.5px; color: #64748b; line-height: 1.5; margin-top: 24px; text-align: center;">
        Need assistance with your course or invoice? Reach our support team at <a href="mailto:support@vstudyonline.com" style="color: #FA5A36; text-decoration: none;">support@vstudyonline.com</a>.
      </p>
    </div>
    <div class="footer">
      VStudyOnline Global Learning Marketplace &bull; Automated Payment Notification<br>
      This is an official transactional notification sent to ${studentEmail}.
    </div>
  </div>
</body>
</html>
  `;

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `Receipt-${receiptNumber || orderId}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  }

  return sendEmail({
    to: studentEmail,
    subject: `Purchase Confirmed: ${courseTitle} (Receipt #${receiptNumber || orderId}) — VStudyOnline`,
    html,
    attachments,
  });
}

/**
 * 2. 1-on-1 Consultation Confirmation Email (Student)
 */
export async function sendConsultationStudentConfirmationEmail({
  studentEmail,
  studentName,
  instructorName,
  consultationDate,
  consultationTime,
  timezone = 'Asia/Kolkata',
  duration = 45,
  bookingCode,
  joinUrl,
}) {
  const appOrigin = getAppOrigin();
  const meetingLink = joinUrl || `${appOrigin}/dashboard/student`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 32px 28px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; padding: 6px 12px; background: rgba(16, 185, 129, 0.2); color: #10b981; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
    .content { padding: 32px 28px; }
    .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .btn { display: block; text-align: center; background: #FA5A36; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; margin: 28px 0 12px; }
    .footer { padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">Appointment Confirmed</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Your 1-on-1 Consultation is Scheduled</h1>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Hello <strong>${studentName || 'Student'}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Your 1-on-1 mentorship session with <strong>${instructorName}</strong> has been confirmed. Below are your meeting coordinates.
      </p>

      <div class="details-box">
        <div class="row"><span>Mentor:</span><span><strong>${instructorName}</strong></span></div>
        <div class="row"><span>Booking Code:</span><span><code>${bookingCode}</code></span></div>
        <div class="row"><span>Date:</span><span>${consultationDate}</span></div>
        <div class="row"><span>Time:</span><span>${consultationTime} (${timezone})</span></div>
        <div class="row"><span>Session Length:</span><span>${duration} Minutes</span></div>
      </div>

      <a href="${meetingLink}" class="btn">Join Video Consultation</a>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px;">
        Please make sure your camera and microphone are tested before the session begins. You can access the room directly from your Student Dashboard.
      </p>
    </div>
    <div class="footer">
      VStudyOnline Mentorship Studio &bull; Live Video Consultation
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: studentEmail,
    subject: `Your 1-on-1 Consultation Is Confirmed — VStudyOnline (${instructorName})`,
    html,
  });
}

/**
 * 3. 1-on-1 Consultation Booking Alert (Instructor)
 */
export async function sendConsultationInstructorAlertEmail({
  instructorEmail,
  instructorName,
  studentName,
  consultationDate,
  consultationTime,
  timezone = 'Asia/Kolkata',
  duration = 45,
  bookingCode,
  studentNotes = '',
  dashboardUrl,
}) {
  const appOrigin = getAppOrigin();
  const dashUrl = dashboardUrl || `${appOrigin}/dashboard/instructor`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 32px 28px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; padding: 6px 12px; background: rgba(59, 130, 246, 0.2); color: #3b82f6; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
    .content { padding: 32px 28px; }
    .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .btn { display: block; text-align: center; background: #0f172a; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; margin: 28px 0 12px; }
    .footer { padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">New Mentorship Booking</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">New 1-on-1 Consultation Booked</h1>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Hello <strong>${instructorName || 'Instructor'}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        A student has booked a 1-on-1 consultation session with you. The session details are as follows:
      </p>

      <div class="details-box">
        <div class="row"><span>Student:</span><span><strong>${studentName}</strong></span></div>
        <div class="row"><span>Booking Code:</span><span><code>${bookingCode}</code></span></div>
        <div class="row"><span>Date:</span><span>${consultationDate}</span></div>
        <div class="row"><span>Time:</span><span>${consultationTime} (${timezone})</span></div>
        <div class="row"><span>Duration:</span><span>${duration} Minutes</span></div>
        ${studentNotes ? `<div class="row"><span>Student Notes:</span><span>${studentNotes}</span></div>` : ''}
      </div>

      <a href="${dashUrl}" class="btn">View in Instructor Dashboard</a>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px;">
        The session room will automatically activate at the scheduled time. You can start the broadcast directly from your consultations calendar.
      </p>
    </div>
    <div class="footer">
      VStudyOnline Mentorship Studio &bull; Instructor Notification
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: instructorEmail,
    subject: `New 1-on-1 Consultation Booked — VStudyOnline (${studentName})`,
    html,
  });
}

/**
 * 4. Instructor Application Approved Email
 */
export async function sendInstructorApplicationApprovedEmail({
  to,
  instructorName,
  actionUrl,
}) {
  const appOrigin = getAppOrigin();
  const targetUrl = actionUrl || `${appOrigin}/dashboard/instructor`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #064e3b; padding: 32px 28px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; padding: 6px 14px; background: rgba(52, 211, 153, 0.2); color: #34d399; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
    .content { padding: 32px 28px; }
    .success-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin: 24px 0; color: #065f46; }
    .btn { display: block; text-align: center; background: #059669; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; margin: 28px 0 12px; }
    .footer { padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">Application Approved</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Welcome to the Teaching Faculty!</h1>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Dear <strong>${instructorName || 'Instructor'}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        We are thrilled to let you know that your professional credentials and verification documents have been reviewed and approved by our team.
      </p>

      <div class="success-box">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">Your Instructor Dashboard is Now Fully Unlocked</h4>
        <p style="margin: 0; font-size: 13px; line-height: 1.5;">
          You can now create courses, host live interactive webinars, publish learning tracks, and mentor students worldwide.
        </p>
      </div>

      <a href="${targetUrl}" class="btn">Launch Instructor Dashboard</a>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px;">
        Next steps: Navigate to your dashboard to complete your course draft or schedule your first cohort session.
      </p>
    </div>
    <div class="footer">
      VStudyOnline Faculty Verification &bull; Automated Decision Notification
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `Congratulations! Your Instructor Application Is Approved — VStudyOnline`,
    html,
  });
}

/**
 * 5. Instructor Application Rejected Email
 */
export async function sendInstructorApplicationRejectedEmail({
  to,
  instructorName,
  reason,
  resubmitUrl,
  refundAmount,
}) {
  const appOrigin = getAppOrigin();
  const targetUrl = resubmitUrl || `${appOrigin}/instructor/onboarding`;
  const formattedRefundAmount = refundAmount ? `₹${Number(refundAmount).toLocaleString('en-IN')}` : null;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #881337; padding: 32px 28px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; padding: 6px 14px; background: rgba(251, 113, 133, 0.2); color: #fb7185; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
    .content { padding: 32px 28px; }
    .reason-box { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; margin: 20px 0; color: #9f1239; }
    .refund-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 20px 0; color: #166534; font-size: 13px; line-height: 1.6; }
    .notice-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 16px; margin: 20px 0; color: #854d0e; font-size: 13px; line-height: 1.6; }
    .footer { padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">Application Update</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Instructor Verification Notice</h1>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Dear <strong>${instructorName || 'Applicant'}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Thank you for your interest in teaching with VStudyOnline. Our verification team has reviewed your application and verification documents.
      </p>

      <div class="reason-box">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">Reason for Rejection:</h4>
        <p style="margin: 0; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${reason || 'The submitted credentials could not be verified according to our platform verification standards.'}</p>
      </div>

      <div class="refund-box">
        <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700;">Registration Fee Refund Notice:</h4>
        <p style="margin: 0;">
          Your registration payment ${formattedRefundAmount ? `of <strong>${formattedRefundAmount}</strong> ` : ''}has been rejected and will be refunded back to your original payment source within <strong>5 to 6 working days</strong>.
        </p>
      </div>

      <div class="notice-box">
        <strong>Please note:</strong> If you wanted to apply again this will happen only after 2 days.
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px;">
        If you have questions or need further clarification, please reply directly to this email to reach our faculty support team.
      </p>
    </div>
    <div class="footer">
      VStudyOnline Faculty Verification &bull; Official Decision Notice
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `Update on Your Instructor Application — VStudyOnline`,
    html,
  });
}

/**
 * 6. Instructor Changes Requested Email
 */
export async function sendInstructorChangesRequestedEmail({
  to,
  instructorName,
  feedback,
  resubmitUrl,
}) {
  const appOrigin = getAppOrigin();
  const targetUrl = resubmitUrl || `${appOrigin}/instructor/onboarding`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #78350f; padding: 32px 28px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; padding: 6px 14px; background: rgba(251, 191, 36, 0.2); color: #fbbf24; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
    .content { padding: 32px 28px; }
    .feedback-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin: 24px 0; color: #92400e; }
    .btn { display: block; text-align: center; background: #d97706; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; margin: 28px 0 12px; }
    .footer { padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">Action Required</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Revisions Requested for Verification</h1>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Dear <strong>${instructorName || 'Applicant'}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Your instructor application has been reviewed. Before we can finalize your approval, please address the following specific adjustments requested by our review team:
      </p>

      <div class="feedback-box">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">Requested Adjustments:</h4>
        <p style="margin: 0; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${feedback || 'Please update your verification documents or professional details.'}</p>
      </div>

      <a href="${targetUrl}" class="btn">Update Profile & Documents</a>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px;">
        Once you submit the updated information, your application will be re-evaluated promptly.
      </p>
    </div>
    <div class="footer">
      VStudyOnline Faculty Verification &bull; Revision Notice
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `Action Required: Revisions Requested for Your Instructor Application — VStudyOnline`,
    html,
  });
}

/**
 * 7. Instructor Registration Fee Receipt Email (Itemized Payment Receipt)
 */
export async function sendInstructorFeeReceiptEmail({
  to,
  instructorName,
  amount,
  orderId,
  paymentId,
  paidAt,
  currency = 'INR',
}) {
  const appOrigin = getAppOrigin();
  const targetUrl = `${appOrigin}/instructor/pending-verification`;
  const formattedDate = paidAt
    ? new Date(paidAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 32px 28px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; padding: 6px 14px; background: rgba(52, 211, 153, 0.2); color: #34d399; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
    .content { padding: 32px 28px; }
    .receipt-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .total-row { display: flex; justify-content: space-between; padding: 12px 0 0 0; margin-top: 8px; border-top: 2px solid #0f172a; font-size: 16px; font-weight: 800; color: #0f172a; }
    .btn { display: block; text-align: center; background: #0f172a; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; margin: 28px 0 12px; }
    .footer { padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">Payment Confirmed</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Official Registration Fee Receipt</h1>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Dear <strong>${instructorName || 'Instructor'}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Thank you for submitting your onboarding payment. Your instructor registration fee has been successfully verified and settled.
      </p>

      <div class="receipt-box">
        <div class="row"><span>Item:</span><span><strong>Instructor Account Activation Fee</strong></span></div>
        <div class="row"><span>Order ID:</span><span><code>${orderId}</code></span></div>
        ${paymentId ? `<div class="row"><span>Payment Ref (Cashfree):</span><span><code>${paymentId}</code></span></div>` : ''}
        <div class="row"><span>Date:</span><span>${formattedDate}</span></div>
        <div class="row"><span>Payment Status:</span><span style="color: #059669; font-weight: 700;">PAID ✓</span></div>
        <div class="total-row"><span>Total Paid:</span><span>₹${Number(amount).toLocaleString('en-IN')} ${currency}</span></div>
      </div>

      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Your application has been placed into our verification review queue. You will receive an email update once our team reviews your profile and documents.
      </p>

      <a href="${targetUrl}" class="btn">View Application Status</a>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px;">
        This is an official computer-generated receipt from VStudyOnline.
      </p>
    </div>
    <div class="footer">
      VStudyOnline Faculty Registration &bull; Payment Receipt
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `Official Payment Receipt: Instructor Registration Fee (₹${Number(amount).toLocaleString('en-IN')}) — VStudyOnline`,
    html,
  });
}