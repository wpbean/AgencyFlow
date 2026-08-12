import "server-only";
import { renderTemplate } from "./index";
import { buildUnsubscribeUrl } from "./unsubscribe";
import { escapeHtml, renderDesignToHtml, renderDesignToText } from "./render-design";
import type { EmailDesign } from "./design-types";

export type CampaignRecipientVars = {
  first_name?: string | null;
  last_name?: string | null;
  email: string;
};

// Every campaign send appends an unsubscribe link — this is unconditional (not a
// per-campaign toggle) since these are marketing emails to purchased contact lists.
// campaignId/recipientId are embedded in the unsubscribe link's signed token so a
// resulting opt-out can be attributed back to the campaign/recipient it came from.
export function buildCampaignEmail(
  subjectTemplate: string,
  bodyTemplate: string,
  vars: CampaignRecipientVars,
  design?: EmailDesign | null,
  attribution?: { campaignId?: string; recipientId?: string }
) {
  const renderVars = {
    first_name: vars.first_name || "there",
    last_name: vars.last_name || "",
    email: vars.email,
  };
  const subject = renderTemplate(subjectTemplate, renderVars);
  const unsubscribeUrl = buildUnsubscribeUrl(vars.email, attribution);

  if (design) {
    const text = `${renderDesignToText(design, renderVars)}\n\n—\nDon't want these emails? Unsubscribe: ${unsubscribeUrl}`;
    const html = `${renderDesignToHtml(design, renderVars)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${design.styles.backgroundColor};">
<tr><td align="center" style="padding:0 16px 32px;">
<table role="presentation" width="${design.styles.contentWidth}" cellpadding="0" cellspacing="0" border="0" style="width:${design.styles.contentWidth}px;max-width:100%;">
<tr><td style="padding-top:12px;border-top:1px solid #e5e5e5;font-size:12px;color:#888888;font-family:sans-serif;">
  Don't want these emails? <a href="${unsubscribeUrl}" style="color:#888888">Unsubscribe</a>
</td></tr>
</table>
</td></tr>
</table>`;
    return { subject, text, html };
  }

  const body = renderTemplate(bodyTemplate, renderVars);
  const text = `${body}\n\n—\nDon't want these emails? Unsubscribe: ${unsubscribeUrl}`;
  const html = `<div style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;line-height:1.6;color:#111">${escapeHtml(body)}</div>
<p style="margin-top:24px;padding-top:12px;border-top:1px solid #e5e5e5;font-size:12px;color:#888888">
  Don't want these emails? <a href="${unsubscribeUrl}" style="color:#888888">Unsubscribe</a>
</p>`;

  return { subject, text, html };
}
