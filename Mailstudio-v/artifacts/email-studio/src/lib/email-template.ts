export interface EmailTemplateProps {
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  sendingDomain?: string;
  subject?: string;
  message?: string;
  messageHtml?: string;
  ctaEnabled?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;");
}

/** Replace {{year}}, {{company_name}}, {{company_address}} in any string */
function applyVars(
  text: string,
  vars: { year: string; company_name: string; company_address: string }
): string {
  return text
    .replace(/\{\{year\}\}/g, vars.year)
    .replace(/\{\{company_name\}\}/g, vars.company_name)
    .replace(/\{\{company_address\}\}/g, vars.company_address);
}

export function generateEmailHtml(props: EmailTemplateProps): string {
  const {
    logoUrl,
    companyName,
    companyAddress,
    sendingDomain,
    subject,
    message,
    messageHtml,
    ctaEnabled,
    ctaLabel,
    ctaUrl,
  } = props;

  const vars = {
    year: String(new Date().getFullYear()),
    company_name: companyName || "Your Company",
    company_address: companyAddress || "",
  };

  const logoSection = logoUrl
    ? `<div style="margin-bottom:40px">
        <img src="${escapeAttr(logoUrl)}" alt="${escapeAttr(companyName || "Logo")}" height="48" style="display:block;max-width:200px;object-fit:contain" />
      </div>`
    : "";

  // Apply vars to message before rendering
  const resolvedMessage = message ? applyVars(message, vars) : "";
  const resolvedMessageHtml = messageHtml ? applyVars(messageHtml, vars) : "";

  const bodyContent = resolvedMessageHtml
    ? `<div style="color:#b3b3b3;font-size:16px;line-height:1.6;margin:0 0 32px 0">${resolvedMessageHtml}</div>`
    : `<p style="color:#b3b3b3;font-size:16px;line-height:1.6;white-space:pre-wrap;margin:0 0 32px 0">${escapeHtml(resolvedMessage || "Your message will appear here.")}</p>`;

  const ctaSection =
    ctaEnabled && ctaUrl
      ? `<div style="margin-bottom:32px">
          <a href="${escapeAttr(ctaUrl)}"
             style="background-color:#ffffff;color:#131313;padding:14px 28px;border-radius:6px;font-weight:600;font-size:14px;text-decoration:none;display:inline-block">
            ${escapeHtml(ctaLabel || "Learn more")}
          </a>
        </div>`
      : "";

  // Footer lines
  const footerLines: string[] = [];
  if (companyName) footerLines.push(`<strong>${escapeHtml(companyName)}</strong>`);
  if (companyAddress) footerLines.push(escapeHtml(companyAddress));
  footerLines.push(`&copy; ${vars.year}${companyName ? ` ${escapeHtml(companyName)}` : ""}. All rights reserved.`);
  if (sendingDomain) {
    footerLines.push(
      `You are receiving this email because you signed up at ${escapeHtml(sendingDomain)}.`
    );
  }

  const footerHtml = footerLines
    .map((line) => `<p style="color:#555555;font-size:11px;margin:0 0 4px 0">${line}</p>`)
    .join("\n    ");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject || "New message")}</title>
</head>
<body style="background-color:#131313;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;margin:0;padding:0">
  <div style="background-color:#131313;max-width:640px;margin:0 auto;padding:48px 32px">
    ${logoSection}
    
    ${bodyContent}
    ${ctaSection}
    <hr style="border:none;border-top:1px solid #2a2a2a;margin:40px 0 24px 0" />
    <div>
    ${footerHtml}
    </div>
  </div>
</body>
</html>`;
}
