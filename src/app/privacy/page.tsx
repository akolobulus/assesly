
import { LegalPageLayout } from '@/components/layout/LegalPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout pageTitle="Privacy Policy">
      <div className="space-y-6">
        <p className="lead">
          Keep your data protected with powerful security features of FormFlow. Learn more about which technologies we use to protect your data.
        </p>
        
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">1- Introduction</h2>
          <p>
            FormFlow is an online form builder that allows you to collect data of any size. We believe that everyone has a right to privacy. We view privacy as a key part of the value that we deliver to our customers.
          </p>
          <p>
            This privacy policy explains how FormFlow uses and processes your personal data and applies to all the products, services, and websites offered by Vetify Inc. which is based in the USA. Products, apps, services, and websites are collectively referred to as the "Services" in this policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">2- Information We Collect</h2>
          <p>
            We collect information you provide directly to us when you create an account, build forms, or otherwise communicate with us. This may include your name, email address, and any information you choose to include in your forms.
          </p>
          <p>
            We also collect information automatically when you use our Services, such as your IP address, browser type, and usage details.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">3- How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve our Services, to develop new features, to protect FormFlow and our users, and to personalize the FormFlow experience.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">4- Sharing Your Information</h2>
          <p>
            We do not share your personal information with companies, organizations, or individuals outside of FormFlow except in the following cases: with your consent, for external processing by trusted partners based on our instructions, or for legal reasons.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">5- Data Security</h2>
          <p>
            We work hard to protect FormFlow and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">6- Changes to This Policy</h2>
          <p>
            We may change this Privacy Policy from time to time. We will post any privacy policy changes on this page and, if the changes are significant, we will provide a more prominent notice.
          </p>
          <p><em>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>
        </section>
      </div>
    </LegalPageLayout>
  );
}
