import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqItems = [
  {
    question: 'How is Assesly different from tools like Google Forms?',
    answer: 'Assesly goes beyond simple data collection. It offers smart applicant filtering, multi-user access, reviewer workflows, and automated communication — all designed specifically for application and vetting processes.',
  },
  {
    question: 'Can I use Assesly for multiple programs at once?',
    answer: 'Yes! Assesly is designed to handle multiple programs, forms, and application cycles simultaneously. You can organize these into folders and manage them efficiently from your dashboard.',
  },
  {
    question: 'Is any technical skill required to use Assesly?',
    answer: 'Not at all. Assesly features an intuitive drag-and-drop form builder and a user-friendly interface. If you can use common web applications, you can use Assesly.',
  },
  {
    question: 'Can I collaborate with my team on Assesly?',
    answer: 'Absolutely. Assesly supports team collaboration with role-based access, allowing you to invite team members to review applications, manage forms, or administer the account based on permissions you set.',
  },
  {
    question: 'Is there a free plan?',
    answer: 'Yes, Assesly offers a free plan with essential features to get you started. We also have Pro and Enterprise plans for more advanced needs and higher usage limits. Check our Pricing page for more details.',
  },
  {
    question: 'How secure is my data with Assesly?',
    answer: 'Data security is our top priority. Assesly is built on Firebase, leveraging its robust security features. All data transmission is encrypted, and we follow industry best practices to protect your information.',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-start">
          <div className="md:col-span-4">
            <h2 className="text-5xl font-bold text-foreground leading-tight">
              Frequently Asked <br /> Questions
            </h2>
          </div>
          <div className="md:col-span-8">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b last:border-b-0 py-2"
                >
                  <AccordionTrigger className="py-4 text-lg text-left hover:no-underline font-medium">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-1 text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
