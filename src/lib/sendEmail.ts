import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  verificationCode: string
) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f9; border: 1px solid #ddd;">
      <h2 style="color: #333;">우양신소재 영업관리 시스템</h2>
      <p style="font-size: 16px; color: #555;">
        안녕하세요! 아래 인증번호를 입력해 로그인 절차를 완료해주세요:
      </p>
      <div style="margin: 20px 0; padding: 10px; font-size: 24px; font-weight: bold; text-align: center; background-color: #fff; border: 1px solid #ccc; border-radius: 5px;">
        ${verificationCode}
      </div>
      <p style="font-size: 14px; color: #999;">이 인증번호는 10분 동안 유효합니다.</p>
      <p style="font-size: 14px; color: #999;">감사합니다! 😊</p>
    </div>
  `;

  const mailOptions = {
    from: `"우양신소재" <${process.env.EMAIL_USER}>`, // 발신자 이름과 이메일 설정
    to,
    subject,
    html: htmlContent, // HTML 형식의 이메일 내용
  };

  return transporter.sendMail(mailOptions);
}
