import type { ComposeState } from "@/App";

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  compose: Partial<ComposeState>;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    description: "Greet a new user or subscriber",
    compose: {
      subject: "Welcome to {{company}} — you're in!",
      message: `Hey there 👋

We're so glad you joined us. Here's what you can expect:

- **Instant access** to everything we offer
- **Weekly updates** with tips and new features
- **Priority support** whenever you need help

If you have any questions, just reply to this email — we'd love to hear from you.

Cheers,
The {{company}} Team`,
      ctaEnabled: true,
      ctaLabel: "Get started",
      ctaUrl: "https://yourdomain.com/dashboard",
    },
  },
  {
    id: "announcement",
    name: "Product Announcement",
    description: "Share a new feature or launch",
    compose: {
      subject: "Introducing {{feature}} — something big just landed",
      message: `We've been working on something exciting, and it's finally here.

**Introducing {{feature}}**

Here's what's new:

- **Feature one** — describe the benefit
- **Feature two** — describe the benefit
- **Feature three** — describe the benefit

This update is available to all users starting today.

Questions or feedback? Hit reply — we read everything.`,
      ctaEnabled: true,
      ctaLabel: "See what's new",
      ctaUrl: "https://yourdomain.com/changelog",
    },
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Regular update to your audience",
    compose: {
      subject: "{{Company}} — {{Month}} Update",
      message: `**Here's what's been happening**

It's been a busy month. Here's a quick roundup of what we've been up to.

---

**📦 What shipped**

We shipped X, Y, and Z this month. The team has been heads-down and we're proud of what came out.

---

**📖 Worth reading**

- [Article title](https://example.com) — one-line summary
- [Article title](https://example.com) — one-line summary

---

**🗓️ Coming up**

Next month we're focused on...

Thanks for being part of the journey.`,
      ctaEnabled: false,
      ctaLabel: "Read more",
      ctaUrl: "",
    },
  },
  {
    id: "password-reset",
    name: "Password Reset",
    description: "Transactional reset link email",
    compose: {
      subject: "Reset your {{company}} password",
      message: `We received a request to reset the password for your account.

If you made this request, click the button below. The link will expire in **1 hour**.

If you didn't request a password reset, you can safely ignore this email — your password won't change.`,
      ctaEnabled: true,
      ctaLabel: "Reset my password",
      ctaUrl: "https://yourdomain.com/reset?token=REPLACE_ME",
    },
  },
  {
    id: "invoice",
    name: "Invoice / Receipt",
    description: "Payment confirmation or invoice",
    compose: {
      subject: "Your receipt from {{company}}",
      message: `Thank you for your payment — here's your receipt.

**Order summary**

| Item | Amount |
|------|--------|
| Pro Plan (monthly) | $29.00 |
| **Total** | **$29.00** |

Your invoice number is **INV-0001**. A PDF copy is attached.

Questions about your bill? Reply to this email and we'll help.`,
      ctaEnabled: true,
      ctaLabel: "View invoice",
      ctaUrl: "https://yourdomain.com/invoices/INV-0001",
    },
  },
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch",
    compose: {
      subject: "",
      message: "",
      ctaEnabled: false,
      ctaLabel: "Learn more",
      ctaUrl: "",
      to: "",
    },
  },
];

export function getTemplate(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === id);
}
