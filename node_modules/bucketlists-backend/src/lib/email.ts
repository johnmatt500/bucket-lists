import nodemailer from 'nodemailer'

function createTransporter() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) return null
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
}

const transporter = createTransporter()

export async function sendInvitationEmail(opts: {
  toEmail: string
  inviterName: string
  bucketName: string
  token: string
}): Promise<void> {
  const acceptUrl = `${process.env.APP_URL}/invite/${opts.token}`

  if (!transporter) {
    console.warn(`[email] No Gmail credentials — skipping invitation email to ${opts.toEmail}`)
    console.warn(`[email] Invite link: ${acceptUrl}`)
    return
  }

  await transporter.sendMail({
    from: `"BucketLists" <${process.env.GMAIL_USER}>`,
    to: opts.toEmail,
    subject: `${opts.inviterName} invited you to a bucket list`,
    text: `${opts.inviterName} invited you to join "${opts.bucketName}".\n\nAccept: ${acceptUrl}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#F5EFE4;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#fff;border-radius:12px;padding:40px 36px;border:1px solid rgba(27,56,40,0.11);">
        <tr>
          <td style="padding-bottom:24px;border-bottom:1px solid rgba(27,56,40,0.11);">
            <span style="font-size:22px;font-weight:800;color:#1B3828;font-style:italic;">BucketLists</span>
          </td>
        </tr>
        <tr><td style="padding-top:28px;">
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#1B3828;letter-spacing:-0.03em;">You've been invited</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#7A6A52;font-style:italic;">${opts.inviterName} wants you to join their bucket list.</p>
          <div style="background:#F5EFE4;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.07em;font-weight:600;color:#7A6A52;">Bucket</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1B3828;">${opts.bucketName}</p>
          </div>
          <a href="${acceptUrl}" style="display:block;text-align:center;background:#1B3828;color:#F5EFE4;text-decoration:none;font-size:16px;font-weight:600;padding:14px 24px;border-radius:7px;">Accept invitation</a>
          <p style="margin:20px 0 0;font-size:13px;color:#7A6A52;text-align:center;">Or copy: <a href="${acceptUrl}" style="color:#C8893A;">${acceptUrl}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  })
}
