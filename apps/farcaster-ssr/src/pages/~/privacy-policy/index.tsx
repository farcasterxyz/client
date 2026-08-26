import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';

import { OGHead } from '~/components/meta/OGHead';
import { H1, H2, H3, Para } from '~/components/text/Paragraph';
import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getImageUrl } from '~/utils/imageUtils';

const title = 'Farcaster Privacy Policy';
const description =
  'Farcaster Privacy Policy – protecting your personal information.';

export default function PrivacyPolicyPage() {
  const { host } = useRequest();

  return (
    <>
      <OGHead
        description={description}
        imageUrl={getImageUrl({ path: defaultOGImagePath, host })}
        title={title}
        type="website"
        url={`${host}${appPathPrefix}/signup`}
      />
      <H1>PRIVACY NOTICE</H1>
      <Para>
        <strong>Last Updated: March 11, 2025</strong>
      </Para>
      <Para>
        Thank you for choosing to be part of our community at Neynar, Inc. (“
        <strong>Company</strong>”, “<strong>we</strong>”, “<strong>us</strong>
        ”, or “<strong>our</strong>”). We are committed to protecting your
        personal information and your right to privacy. For any questions,
        contact us at{' '}
        <a href="mailto:team+contact@neynar.com">team+contact@neynar.com</a>.
      </Para>
      <Para>This notice describes how we use your information if you:</Para>
      <ul className="bullets">
        <li>
          <Para>Download and use our mobile application — Farcaster</Para>
        </li>
        <li>
          <Para>
            Engage with us in related ways – including sales, marketing, or
            events
          </Para>
        </li>
      </ul>
      <Para>
        In this notice, “<strong>App</strong>” refers to any application linking
        to this policy and “<strong>Services</strong>” refers to our App and
        related services.
      </Para>
      <Para>
        The purpose is to explain what information we collect, how we use it,
        and your rights. If you disagree with any terms, please discontinue use
        of our Services.
      </Para>
      <Para>
        <strong>
          Please read this notice carefully to understand our practices.
        </strong>
      </Para>

      <H2>1. WHAT INFORMATION DO WE COLLECT?</H2>
      <H3>Personal information you disclose to us</H3>
      <Para>
        <strong>
          <em>In Short:</em>
        </strong>{' '}
        <em>We collect personal information that you provide to us.</em>
      </Para>
      <Para>
        We collect information you voluntarily provide when you request
        information, participate in activities, or contact us.
      </Para>
      <Para>
        This includes details based on your interactions with the App, choices
        you make, and features you use.
      </Para>
      <H3>Personal Information Provided by You</H3>
      <Para>
        <em>Email Address</em> – For authentication and communication.
      </Para>
      <Para>
        <em>Phone Number</em> – For identity verification and two-factor
        authentication.
      </Para>
      <Para>
        <em>Photos</em> – Only those you opt to share publicly.
      </Para>
      <Para>
        If you post photos, permission is requested to access your device’s
        photos. We do not store any photos other than those you share publicly.
      </Para>
      <Para>
        All personal information provided must be true, complete, and updated as
        needed.
      </Para>

      <H3>Information automatically collected</H3>
      <Para>
        <strong>
          <em>In Short:</em>
        </strong>{' '}
        <em>
          Some technical data (IP address, browser/device info) is collected
          automatically.
        </em>
      </Para>
      <Para>
        We automatically collect device and usage information (e.g. IP address,
        browser type, operating system, language, referring URLs) for security,
        analytics, and operational purposes.
      </Para>

      <H3>Information collected through our App</H3>
      <Para>
        <strong>
          <em>In Short:</em>
        </strong>{' '}
        <em>We collect mobile device and push notification data.</em>
      </Para>
      <Para>If you use our App, we collect:</Para>
      <ul className="bullets">
        <li>
          <Para>
            <em>Mobile Device Access:</em> Requesting access to features
            (camera, storage) – adjustable in your settings.
          </Para>
        </li>
        <li>
          <Para>
            <em>Mobile Device Data:</em> Automatically collected device ID,
            model, OS, network details.
          </Para>
        </li>
        <li>
          <Para>
            <em>Push Notifications:</em> Permission to send notifications
            regarding your account or features.
          </Para>
        </li>
      </ul>
      <Para>
        This data supports security, troubleshooting, and internal analytics.
      </Para>

      <H2>2. HOW DO WE USE YOUR INFORMATION?</H2>
      <Para>
        <strong>
          <em>In Short:</em>
        </strong>{' '}
        <em>
          We use your information for business interests, contract fulfillment,
          legal compliance, and consent-based purposes.
        </em>
      </Para>
      <Para>
        Uses include fulfilling orders, administering competitions, delivering
        services, responding to inquiries, sending marketing communications, and
        targeted advertising.
      </Para>
      <ul className="bullets">
        <li>
          <Para>
            <strong>Fulfill and manage orders.</strong>
          </Para>
        </li>
        <li>
          <Para>
            <strong>Administer prize draws and competitions.</strong>
          </Para>
        </li>
        <li>
          <Para>
            <strong>Deliver requested services.</strong>
          </Para>
        </li>
        <li>
          <Para>
            <strong>Respond to inquiries and offer support.</strong>
          </Para>
        </li>
        <li>
          <Para>
            <strong>Send marketing and promotional communications.</strong>
          </Para>
        </li>
        <li>
          <Para>
            <strong>Deliver targeted advertising.</strong>
          </Para>
        </li>
      </ul>

      <H2>3. INFORMATION SHARING AND DISCLOSURE</H2>
      <H3>Optional Rewards Program</H3>
      <Para>
        Participation may require additional identity and tax verification. This
        data is used solely to comply with tax laws, stored securely, and
        retained for up to 7 years.
      </Para>
      <H3>We Do Not Sell Your Information</H3>
      <Para>
        We do not sell, rent, or trade your personal information to third
        parties for marketing.
      </Para>
      <H3>Limited Sharing With Third Parties</H3>
      <Para>
        <strong>
          <em>In Short:</em>
        </strong>{' '}
        <em>
          We share your data only with your consent or as legally required.
        </em>
      </Para>
      <Para>
        Sharing may occur based on consent, legitimate interests, contract
        performance, legal obligations, or vital interests, including during
        business transfers.
      </Para>
      <H3>Service Provider Requirements</H3>
      <Para>
        All service providers are contractually required to use your data only
        for the services they provide, implement proper security, and comply
        with data protection laws.
      </Para>

      <H2>4. HOW LONG DO WE KEEP YOUR INFORMATION?</H2>
      <Para>
        <strong>
          <em>In Short:</em>
        </strong>{' '}
        <em>
          Data is retained only as long as necessary unless law requires
          otherwise.
        </em>
      </Para>
      <Para>
        We retain personal data only as long as needed for the purposes
        outlined, after which it is deleted or anonymized.
      </Para>

      <H2>5. HOW DO WE KEEP YOUR INFORMATION SAFE?</H2>
      <Para>
        <strong>
          <em>In Short:</em>
        </strong>{' '}
        <em>
          We implement robust security measures, though no system is 100%
          secure.
        </em>
      </Para>
      <Para>
        Despite our safeguards, electronic transmission is not entirely
        risk-free. Use the App in a secure environment.
      </Para>

      <H2>6. DO WE COLLECT INFORMATION FROM MINORS?</H2>
      <Para>
        <strong>
          <em>In Short:</em>
        </strong>{' '}
        <em>We do not knowingly collect or market to children under 18.</em>
      </Para>
      <Para>
        We do not solicit data from children under 18. If discovered, such data
        is promptly deleted. Contact{' '}
        <a href="mailto:support+privacy@neynar.com">
          support+privacy@neynar.com
        </a>{' '}
        with concerns.
      </Para>

      <H2>7. WHAT ARE YOUR PRIVACY RIGHTS?</H2>
      <Para>
        <strong>
          <em>In Short:</em>
        </strong>{' '}
        <em>You may review, change, or terminate your account at any time.</em>
      </Para>
      <Para>
        Residents in the EEA, UK, and Switzerland have additional rights. See{' '}
        <a href="https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm">
          EEA/UK Authorities
        </a>{' '}
        and{' '}
        <a href="https://www.edoeb.admin.ch/edoeb/en/home.html">
          Switzerland DPA
        </a>
        .
      </Para>

      <H2>8. CONTROLS FOR DO-NOT-TRACK FEATURES</H2>
      <Para>
        Most browsers and mobile OSs have a Do-Not-Track feature. We currently
        do not respond to DNT signals.
      </Para>

      <H2>9. DO CALIFORNIA RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</H2>
      <Para>
        <strong>
          <em>In Short:</em>
        </strong>{' '}
        <em>
          California residents have specific rights regarding their personal
          information.
        </em>
      </Para>
      <Para>
        California residents may request details of data disclosed for direct
        marketing annually, per California Civil Code Section 1798.83. If under
        18, you may request removal of unwanted data by including your email and
        a residency statement.
      </Para>
      <H3>CCPA Privacy Notice</H3>
      <Para>
        The California Code of Regulations defines “resident” as (1) any
        individual in California for non-temporary purposes and (2) any
        individual domiciled in California for temporary purposes.
      </Para>
      <Para>
        Others are “non-residents.” Rights and obligations apply accordingly.
      </Para>
      <H3>What categories of personal information do we collect?</H3>
      <table className="table-with-borders">
        <thead>
          <tr>
            <td>Category</td>
            <td>Examples</td>
            <td>Collected</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A. Identifiers</td>
            <td>
              Real name, alias, postal address, telephone, unique identifier, IP
              address, email, account name
            </td>
            <td>YES</td>
          </tr>
          <tr>
            <td>B. Personal info per California Customer Records</td>
            <td>Name, contact, education, employment, financial info</td>
            <td>YES</td>
          </tr>
          <tr>
            <td>C. Protected classification characteristics</td>
            <td>Gender, date of birth</td>
            <td>NO</td>
          </tr>
          <tr>
            <td>D. Commercial information</td>
            <td>Transaction info, purchase history, payment info</td>
            <td>NO</td>
          </tr>
          <tr>
            <td>E. Biometric information</td>
            <td>Fingerprints, voiceprints</td>
            <td>NO</td>
          </tr>
          <tr>
            <td>F. Internet activity</td>
            <td>Browsing history, search history, online behavior</td>
            <td>NO</td>
          </tr>
          <tr>
            <td>G. Geolocation data</td>
            <td>Device location</td>
            <td>NO</td>
          </tr>
          <tr>
            <td>H. Audio/Visual information</td>
            <td>Images, audio, video recordings</td>
            <td>YES</td>
          </tr>
          <tr>
            <td>I. Professional/Employment info</td>
            <td>Business contact, job title, work history</td>
            <td>NO</td>
          </tr>
          <tr>
            <td>J. Education Information</td>
            <td>Student records, directory info</td>
            <td>NO</td>
          </tr>
          <tr>
            <td>K. Inferences drawn from personal info</td>
            <td>Profiles or summaries of preferences</td>
            <td>NO</td>
          </tr>
        </tbody>
      </table>
      <Para>
        Additional information may be collected through in-person, online,
        phone, or mail interactions.
      </Para>
      <H3>How do we use and share your personal information?</H3>
      <Para>
        For further details, contact us at{' '}
        <a href="mailto:support+privacy@neynar.com">
          support+privacy@neynar.com
        </a>
        .
      </Para>
      <Para>
        If using an authorized agent, proof of authorization is required.
      </Para>
      <H3>Will your information be shared with anyone else?</H3>
      <Para>
        We may share your information with contracted service providers. This is
        not considered selling your data.
      </Para>
      <H3>Your rights with respect to your personal data</H3>
      <Para>
        <strong>Right to request deletion – Request to delete:</strong> You may
        ask for deletion, subject to legal exceptions.
      </Para>
      <Para>
        <strong>Right to be informed – Request to know:</strong> You have the
        right to know what data is collected, how it’s used, and if it’s sold.
      </Para>
      <Para>
        <strong>Right to Non-Discrimination:</strong> We will not discriminate
        if you exercise your privacy rights.
      </Para>
      <Para>
        <strong>Verification process:</strong> We may request additional info to
        verify your identity.
      </Para>
      <ul className="bullets">
        <li>
          <Para>You may object to processing.</Para>
        </li>
        <li>
          <Para>You may request correction or restriction.</Para>
        </li>
        <li>
          <Para>You may designate an authorized agent under CCPA.</Para>
        </li>
        <li>
          <Para>You may opt-out of future selling of your data.</Para>
        </li>
      </ul>
      <Para>
        To exercise these rights, email us at{' '}
        <a href="mailto:support+privacy@neynar.com">
          support+privacy@neynar.com
        </a>
        .
      </Para>

      <H2>10. ADDITIONAL INFORMATION</H2>
      <H3>10.1 In-App Purchases and Payment Processing</H3>
      <Para>
        In-app purchases are processed via the Apple App Store and Google Play
        Store. Payment data is handled solely by the respective store.
      </Para>
      <Para>
        Refer to{' '}
        <a href="https://www.apple.com/legal/privacy/">
          Apple’s Privacy Policy
        </a>{' '}
        and{' '}
        <a href="https://policies.google.com/privacy">
          Google’s Privacy Policy
        </a>{' '}
        for details.
      </Para>
      <H3>10.2 Third-Party Services</H3>
      <Para>
        Our App may include links to third-party sites. This notice does not
        apply to them.
      </Para>
      <Para>
        We use the Google Maps API; see{' '}
        <a href="https://policies.google.com/privacy">
          Google’s Privacy Policy
        </a>
        .
      </Para>
      <H3>10.3 Do-Not-Track Signals</H3>
      <Para>We currently do not respond to Do-Not-Track browser signals.</Para>
      <H3>10.4 Data Protection Officer</H3>
      <Para>
        Contact our Data Protection Officer at{' '}
        <a href="mailto:team+dpo@neynar.com">team+dpo@neynar.com</a>.
      </Para>

      <H2>11. DO WE MAKE UPDATES TO THIS NOTICE?</H2>
      <Para>
        <strong>
          <em>In Short:</em>
        </strong>{' '}
        <em>Yes, updates will be made as necessary.</em>
      </Para>
      <Para>
        Updates become effective immediately upon posting. Please review
        periodically.
      </Para>

      <H2>12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</H2>
      <Para>
        For questions or comments, email{' '}
        <a href="mailto:support+privacy@neynar.com">
          support+privacy@neynar.com
        </a>{' '}
        or mail:
      </Para>
      <Para>
        Neynar, Inc.
        <br />
        221 West 9th Street
        <br />
        Wilmington, DE 19801
        <br />
        United States
      </Para>
      <Para>
        We use the Google Maps API; refer to{' '}
        <a href="https://policies.google.com/privacy">
          Google’s Privacy Policy
        </a>
        .
      </Para>

      <H2>
        13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?
      </H2>
      <Para>
        Based on applicable laws, you may request access to, update, or delete
        your personal data. To do so, email{' '}
        <a href="mailto:support+privacy@neynar.com">
          support+privacy@neynar.com
        </a>
        .
      </Para>
    </>
  );
}
