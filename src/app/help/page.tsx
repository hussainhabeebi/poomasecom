import type { Metadata } from "next";
import { PageTitle, Panel } from "@/components/chrome";
import { AskAIButton } from "@/components/client-ui";

export const metadata: Metadata = {
  title: "Help, delivery & returns",
  description: "Delivery times and fees across the UAE, payment options, returns and privacy at POOMAS MART.",
};

const SECTIONS = [
  {
    id: "delivery",
    title: "Delivery",
    body: "Next-day delivery to Dubai, Sharjah and Ajman; 2–3 working days to Abu Dhabi, Umm Al Quwain, Ras Al Khaimah and Fujairah. Retail orders over AED 150 ship free, otherwise AED 15 (Dubai, Sharjah, Ajman) or AED 20 elsewhere. Marketplace items may arrive in a separate shipment from the seller.",
  },
  {
    id: "payment",
    title: "Payment",
    body: "Pay by card through our payment provider's secure page, or cash on delivery. We never store your card number. Approved wholesale accounts may be offered credit terms.",
  },
  {
    id: "returns",
    title: "Returns & refunds",
    body: "Return unused items in original packaging within 14 days of delivery. Request a return from your order page; refunds go back to your original payment method once the item is inspected.",
  },
  {
    id: "privacy",
    title: "Privacy",
    body: "We collect only what we need to fulfil and support your orders — name, contact details and delivery address. Partners such as sellers and couriers only see the details needed for your order. Marketing messages are sent only with your consent. (Final privacy notice to be reviewed by legal advisors.)",
  },
  {
    id: "terms",
    title: "Terms",
    body: "Prices are in UAE dirhams and include 5% VAT for retail customers. Wholesale prices exclude VAT. Product availability is confirmed at checkout. (Final terms to be reviewed by legal advisors.)",
  },
  {
    id: "contact",
    title: "Contact",
    body: "WhatsApp and phone support 9am–10pm, 7 days a week. Email support@poomasmart.ae — or ask POOMAS AI any time.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageTitle eyebrow="Help centre" title="How can we help?">
        <AskAIButton prompt="I need help with my order" className="ai-gradient mt-3 rounded-full px-4 py-2 text-sm font-medium text-white">
          ✨ Ask POOMAS AI
        </AskAIButton>
      </PageTitle>
      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <Panel key={s.id} title={s.title}>
            <p id={s.id} className="scroll-mt-40 leading-relaxed text-zinc-600">
              {s.body}
            </p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
