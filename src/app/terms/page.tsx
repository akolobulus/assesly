
import { LegalPageLayout } from '@/components/layout/LegalPageLayout';

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout pageTitle="Terms of Service">
      <div className="space-y-6">
        <p className="lead">
          Welcome to FormFlow! These Terms of Service ("Terms") govern your access to and use of FormFlow's website, products, and services ("Services"). Please read these Terms carefully.
        </p>
        
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">1- Acceptance of Terms</h2>
          <p>
            By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, do not use our Services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">2- Your Account</h2>
          <p>
            To use certain features of our Services, you may need to create an account. You are responsible for safeguarding your account information and for all activities that occur under your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">3- Use of Services</h2>
          <p>
            You agree to use our Services only for lawful purposes and in accordance with these Terms. You will not use the Services to collect sensitive information (e.g., credit card numbers, social security numbers) without appropriate security measures and compliance with applicable laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">4- Content</h2>
          <p>
            You retain ownership of any content you create or upload using our Services ("Your Content"). By using the Services, you grant FormFlow a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display Your Content solely for the purpose of providing the Services to you.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">5- Termination</h2>
          <p>
            We may terminate or suspend your access to our Services at any time, without prior notice or liability, for any reason, including if you breach these Terms.
          </p>
        </section>

         <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">6- Disclaimer of Warranties</h2>
          <p>
            Our Services are provided "as is." FormFlow makes no warranties, express or implied, regarding the Services, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">7- Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, FormFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">8- Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the new Terms on our website. Your continued use of the Services after such changes constitutes your acceptance of the new Terms.
          </p>
          <p><em>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>
        </section>
      </div>
    </LegalPageLayout>
  );
}
