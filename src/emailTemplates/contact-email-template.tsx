/* Copied from user's design package. Email-safe React template.
   Kept as TSX for developer reference. To use server-side, we can render this with
   ReactDOMServer or use Resend's `react` option after bundling.
*/

export interface ContactEmailProps {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  submittedAt: string;
  ipAddress: string;
  userAgent?: string;
  country?: string;
  city?: string;
  referrer?: string;
  pageUrl?: string;
  submissionId: string;
}

const styles = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: "#f4f4f5",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    color: "#18181b",
    WebkitFontSmoothing: "antialiased",
  } as const,
  wrapper: {
    width: "100%",
    backgroundColor: "#f4f4f5",
    padding: "40px 16px",
  } as const,
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e4e4e7",
    overflow: "hidden",
  } as const,
  header: {
    padding: "32px 32px 24px 32px",
    borderBottom: "1px solid #f4f4f5",
  } as const,
  brandRow: {
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: "20px",
  } as const,
  logoBox: {
    display: "inline-block",
    verticalAlign: "middle" as const,
    marginRight: "10px",
  } as const,
  brandName: {
    fontSize: "14px",
    color: "#18181b",
    verticalAlign: "middle" as const,
  } as const,
  pill: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "9999px",
    backgroundColor: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#047857",
    fontSize: "12px",
  } as const,
  h1: {
    margin: "0 0 6px 0",
    fontSize: "22px",
    lineHeight: 1.3,
    color: "#09090b",
    fontWeight: 600,
  } as const,
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#71717a",
    lineHeight: 1.5,
  } as const,
  actionBar: {
    padding: "16px 32px",
    backgroundColor: "#fafafa",
    borderBottom: "1px solid #f4f4f5",
  } as const,
  buttonPrimary: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "8px",
    backgroundColor: "#18181b",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "13px",
    marginRight: "8px",
  } as const,
  buttonSecondary: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    border: "1px solid #e4e4e7",
    color: "#3f3f46",
    textDecoration: "none",
    fontSize: "13px",
  } as const,
  section: {
    padding: "24px 32px",
    borderBottom: "1px solid #f4f4f5",
  } as const,
  sectionLabel: {
    margin: "0 0 16px 0",
    fontSize: "11px",
    color: "#a1a1aa",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    fontWeight: 500,
  } as const,
  fieldLabel: {
    margin: "0 0 4px 0",
    fontSize: "12px",
    color: "#71717a",
  } as const,
  fieldValue: {
    margin: 0,
    fontSize: "14px",
    color: "#18181b",
    wordBreak: "break-word" as const,
  } as const,
  link: {
    color: "#18181b",
    textDecoration: "underline",
  } as const,
  messageBox: {
    marginTop: "12px",
    padding: "20px",
    backgroundColor: "#fafafa",
    border: "1px solid #f4f4f5",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#3f3f46",
    lineHeight: 1.6,
    whiteSpace: "pre-line" as const,
  } as const,
  metaRow: {
    padding: "8px 0",
    fontSize: "12px",
  } as const,
  metaLabel: {
    color: "#71717a",
    width: "40%",
  } as const,
  metaValue: {
    color: "#3f3f46",
    textAlign: "right" as const,
    wordBreak: "break-all" as const,
  } as const,
  mono: {
    fontFamily:
      "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace",
  } as const,
  footer: {
    padding: "24px 32px",
    backgroundColor: "#fafafa",
  } as const,
  footerText: {
    margin: "8px 0 0 0",
    fontSize: "12px",
    color: "#a1a1aa",
    lineHeight: 1.5,
  } as const,
};

export function ContactEmailTemplate(props: ContactEmailProps) {
  const {
    name,
    email,
    company,
    subject,
    message,
    submittedAt,
    ipAddress,
    userAgent,
    country,
    city,
    referrer,
    pageUrl,
    submissionId,
  } = props;

  const location = [city, country].filter(Boolean).join(", ");

  const Logo = ({ size = 28 }: { size?: number }) => {
    const width = (24.3805 / 32.4117) * size;
    return (
      <svg
        width={width}
        height={size}
        viewBox="0 0 24.3805 32.4117"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "inline-block", verticalAlign: "middle" }}
      >
        <path
          d="M1.05455 5.57132C1.56113 6.01259 2.30787 6.21755 3.00936 6.27299C4.19733 6.37659 5.73101 6.21419 7.0184 6.32619C10.3282 6.57706 12.5846 8.14111 14.2071 10.9444C15.4045 12.8657 16.2585 15.0194 18.2301 16.1786C19.594 16.962 21.4259 17.288 22.7261 16.2878C24.5335 14.8386 24.3212 11.6707 24.3682 9.45708C24.3715 7.65056 24.4184 5.7214 24.3045 3.94904C24.1788 2.20635 23.8845 0.558308 21.9732 0.243035C19.9296 -0.0649586 17.6844 0.0996779 15.3353 0.0369592C12.6667 0.0229595 9.78473 0.0111998 7.0614 0C5.33 0.0201596 3.52599 -0.0873581 2.03698 0.576788C0.0609522 1.46381 -0.638869 4.07279 1.05288 5.56964L1.05511 5.57132H1.05455Z"
          fill="#161616"
        />
        <path
          d="M19.299 25.6107C16.3215 25.5468 13.8434 24.9241 11.8646 22.5408C10.6833 21.1671 9.94271 19.4093 9.2278 17.7837C8.67767 16.5848 8.06888 15.3013 6.95297 14.5453C5.32601 13.4208 2.8959 13.9114 1.60964 15.4038C0.561858 16.5607 0.267519 18.1007 0.132358 19.6507C0.00836754 21.1705 0.0267986 22.8331 0.00892607 24.405C0.00389941 25.9539 -0.025702 27.2475 0.0608681 28.6788C0.235684 31.5454 1.03939 32.1995 3.87442 32.2874C8.62684 32.377 14.5678 32.3955 19.3811 32.4117C20.2284 32.4044 21.1449 32.3708 21.8994 32.1922C24.644 31.6697 25.1103 27.873 22.9126 26.3902C21.8173 25.6891 20.6707 25.6986 19.3029 25.6112H19.2984L19.299 25.6107Z"
          fill="#161616"
        />
      </svg>
    );
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>New contact form submission</title>
      </head>
      <body style={styles.body}>
        <div style={styles.wrapper}>
          <table
            role="presentation"
            cellPadding={0}
            cellSpacing={0}
            border={0}
            width="100%"
            style={styles.container}
          >
            {/* Header */}
            <tbody>
              <tr>
                <td style={styles.header}>
                  <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <tr>
                        <td>
                          <span style={styles.logoBox}>
                            <Logo size={28} />
                          </span>
                          <span style={styles.brandName}>oussamalassoued.me</span>
                        </td>
                        <td align="right">
                          <span style={styles.pill}>● New submission</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <h1 style={{ ...styles.h1, marginTop: "20px" }}>
                    New message from {name}
                  </h1>
                  <p style={styles.subtitle}>
                    You've received a new contact form submission. Reply to this email to respond directly to the sender.
                  </p>
                </td>
              </tr>

              {/* Action bar */}
              <tr>
                <td style={styles.actionBar}>
                  <a href={`mailto:${email}`} style={styles.buttonPrimary}>
                    ↩ Reply to {name.split(" ")[0]}
                  </a>
                  {pageUrl && (
                    <a href={`https://${pageUrl}`} style={styles.buttonSecondary}>
                      ↗ View page
                    </a>
                  )}
                </td>
              </tr>

              {/* Sender */}
              <tr>
                <td style={styles.section}>
                  <p style={styles.sectionLabel}>Sender</p>
                  <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <tr>
                        <td width="50%" style={{ paddingRight: "12px", paddingBottom: "16px" }}>
                          <p style={styles.fieldLabel}>Name</p>
                          <p style={styles.fieldValue}>{name}</p>
                        </td>
                        <td width="50%" style={{ paddingBottom: "16px" }}>
                          <p style={styles.fieldLabel}>Email</p>
                          <p style={styles.fieldValue}>
                            <a href={`mailto:${email}`} style={styles.link}>
                              {email}
                            </a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style={{ paddingRight: "12px" }}>
                          <p style={styles.fieldLabel}>Company</p>
                          <p style={styles.fieldValue}>{company || "—"}</p>
                        </td>
                        <td width="50%">
                          <p style={styles.fieldLabel}>Submitted</p>
                          <p style={styles.fieldValue}>{submittedAt}</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* Message */}
              <tr>
                <td style={styles.section}>
                  <p style={styles.sectionLabel}>Message</p>
                  <p style={styles.fieldLabel}>Subject</p>
                  <p style={{ ...styles.fieldValue, marginBottom: "4px" }}>{subject}</p>
                  <div style={styles.messageBox}>{message}</div>
                </td>
              </tr>

              {/* Technical details */}
              <tr>
                <td style={styles.section}>
                  <p style={styles.sectionLabel}>Technical details</p>
                  <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <tr>
                        <td style={{ ...styles.metaRow, ...styles.metaLabel }}>IP address</td>
                        <td style={{ ...styles.metaRow, ...styles.metaValue }}>{ipAddress || '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* Footer */}
              <tr>
                <td style={styles.footer}>
                  <table role="presentation" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <tr>
                        <td>
                          <Logo size={26} />
                        </td>
                        <td style={{ paddingLeft: "10px" }}>
                          <p style={{ margin: 0, fontSize: "13px", color: "#18181b" }}>
                            Oussama Lassoued
                          </p>
                          <p style={{ margin: 0, fontSize: "12px", color: "#71717a" }}>
                            Designer & Ai builder
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={styles.footerText}>
                    This is an automated notification from your contact form. Replying to this email will respond directly to the sender.
                  </p>
                  <p style={{ ...styles.footerText, marginTop: "4px" }}>
                    © 2026 oussamalassoued.me · Sent via Resend
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  );
}

function MetaTr({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <tr>
      <td style={{ ...styles.metaRow, ...styles.metaLabel }}>{label}</td>
      <td
        style={{
          ...styles.metaRow,
          ...styles.metaValue,
          ...(mono ? styles.mono : {}),
        }}
      >
        {value}
      </td>
    </tr>
  );
}
