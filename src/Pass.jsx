import { QRCodeSVG } from 'qrcode.react'

export default function Pass({ name, matric, programme, email, code, qrImage, confirmed }) {
  // Preview only until registration succeeds; then the real QR from the backend is shown.
  const value = confirmed && code
    ? code
    : matric || email
      ? `UABS-2026|${matric}|${email}`
      : 'UABS-2026'

  return (
    <div className={`pass ${confirmed ? 'pass--confirmed' : ''}`} aria-label="Accreditation pass preview">
      <div className="pass__head">
        <img src="/logo.jpeg" alt="" />
        <div>
          <strong>Accreditation pass</strong>
          <span>UABS Alumni Launch 2026</span>
        </div>
      </div>
      <dl>
        <div><dt>Name</dt><dd className={name ? '' : 'empty'}>{name || 'Your full name'}</dd></div>
        <div><dt>Matric no.</dt><dd className={matric ? '' : 'empty'}>{matric || '00/000XXX/000'}</dd></div>
        <div><dt>Programme</dt><dd className={programme ? '' : 'empty'}>{programme || 'Your programme'}</dd></div>
        <div><dt>Email</dt><dd className={email ? '' : 'empty'}>{email || 'you@email.com'}</dd></div>
      </dl>
      <div className="pass__code">
        {confirmed && qrImage ? (
          <img src={qrImage} width={132} height={132} alt="Your accreditation QR code" style={{ display: 'block' }} />
        ) : (
          <QRCodeSVG value={value} size={132} level="M" fgColor="#13241a" bgColor="#ffffff" />
        )}
        <span>{confirmed ? code : 'Your QR code is emailed after you register'}</span>
      </div>
    </div>
  )
}