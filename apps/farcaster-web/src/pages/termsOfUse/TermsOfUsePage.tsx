import { getNotionLinkTarget } from 'farcaster-client-hooks';
import React from 'react';

import { ExternalLink } from '~/components/links/ExternalLink';
import { Link } from '~/components/links/Link';
import { StandalonePage } from '~/components/page/StandalonePage';
import { H1 } from '~/components/text/H1';
import { H2 } from '~/components/text/H2';
import { Para } from '~/components/text/Para';

const TermsOfUsePage: React.FC = React.memo(() => {
  return (
    <StandalonePage meta={{ title: 'Farcaster Terms of Use' }}>
      <div className="py-4">
        <H1>Neynar - Terms of Use</H1>
        <H2>Last Updated: November 14, 2022</H2>
        <Para>
          Welcome to Neynar! We are the creators of the “Farcaster” mobile and
          desktop-based apps (collectively, the “App”) and provide cloud-based
          services to access and communicate through the Farcaster protocol. And
          we’re glad you’re here to read these Terms of Use. If you have “any
          questions” about any of this, you can contact us at:
          team+contact@neynar.com, and we’ll do our best to help. Our website
          and the App are owned and provided by Neynar, Inc. In these Terms of
          Use, we won’t use the full corporate name. Instead, we’ll refer to the
          company as “Neynar”. And when we say “we,” “us,” or “our,” that’s also
          referring to the company. We encourage you to read these Terms of Use
          (the “Terms”) and our{' '}
          <Link
            to="privacyPolicy"
            params={{}}
            searchParams={{}}
            title="Privacy Policy"
          >
            Privacy Policy
          </Link>{' '}
          carefully because they - along with other posted policies, rules, and
          guidelines - govern your use of and interaction with our website
          (farcaster.xyz) (the “Site”), the App, the other features and software
          and technologies we provide, and our communications with you. To make
          these Terms easier to read, we use the word “Services” here to
          collectively describe and encompass our Site, the App, the other
          features and software and technologies we provide, and our
          communications with you. These Terms govern your access to and use of
          our Services, whether as a guest, Site visitor, or registered user, as
          applicable, including account holders and non-account holders (each a
          “User,” collectively “Users”). By using the Services, you acknowledge
          that you have read and understood these Terms and you accept and agree
          to be bound and abide by these Terms. If you do not agree with any
          part of the Terms, you must not use the Services.
        </Para>

        <H2>Community Guidlines</H2>
        <Para>
          By agreeing to these Terms of Service, you are agreeing to the{' '}
          <ExternalLink
            href={getNotionLinkTarget({ to: 'community-guidelines' })}
            title="Community Guidelines"
          >
            Community Guidelines
          </ExternalLink>
          .
        </Para>
        <Para>
          These include: zero tolerance for abusive users or harassment of
          others, zero tolerance for hate speech, no posting illegal content, no
          incitement to violence, no spam, no misleading impersonation and users
          should respect intellectual property.
        </Para>

        <H2>Important Notice Regarding Arbitration</H2>
        <Para>
          PLEASE READ THESE TERMS OF USE CAREFULLY, AS THEY CONTAIN AN AGREEMENT
          TO ARBITRATE AND OTHER IMPORTANT INFORMATION REGARDING YOUR LEGAL
          RIGHTS, REMEDIES, AND OBLIGATIONS. THE AGREEMENT TO ARBITRATE REQUIRES
          (WITH LIMITED EXCEPTION) THAT YOU SUBMIT CLAIMS YOU HAVE AGAINST US TO
          BINDING AND FINAL ARBITRATION, AND FURTHER THAT: (1) YOU WILL ONLY BE
          PERMITTED TO PURSUE CLAIMS AGAINST COMPANY ON AN INDIVIDUAL BASIS, NOT
          AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS OR REPRESENTATIVE ACTION
          OR PROCEEDING, (2) YOU WILL ONLY BE PERMITTED TO SEEK RELIEF
          (INCLUDING MONETARY, INJUNCTIVE, AND DECLARATORY RELIEF) ON AN
          INDIVIDUAL BASIS, AND (3) YOU MAY NOT BE ABLE TO HAVE ANY CLAIMS YOU
          HAVE AGAINST US RESOLVED BY A JURY OR IN A COURT OF LAW.
        </Para>
        <H2>Changes to Terms and Services</H2>
        <Para>
          Our Services are evolving, and hence we may update them and the Terms
          from time to time. If we modify the Terms, we’ll let you know either
          by posting the updated Terms within the Services or through other
          communications. It’s important that you review the Terms whenever we
          update them or when you use the Services. If you continue to use the
          Services after we have posted updated Terms, you are agreeing to be
          bound by the updated Terms. If you don’t agree to be bound by the
          updated Terms, then you may not use the Services anymore and you are
          prohibited from doing so. We may, at our sole discretion, change or
          discontinue all or any part of the offerings we provide via our
          Services, at any time and without notice.
        </Para>
        <Para>
          You acknowledge that Neynar may establish general practices and limits
          concerning use of the Services, including the maximum period of time
          that data or other content will be retained by the Services and the
          maximum storage space that will be allotted on Neynar’s or its
          third-party service providers’ servers on your behalf. You agree that
          Neynar has no responsibility or liability for the deletion or failure
          to store any data or other content maintained or uploaded by the
          Services. You acknowledge that Neynar reserves the right to terminate
          Accounts (as defined below) that are inactive for an extended period
          of time. You further acknowledge that Neynar reserves the right to
          change these general practices and limits at any time, in its sole
          discretion, with or without notice.
        </Para>
        <H2>Accessing the Services</H2>
        <Para>
          You are responsible for obtaining the data network access necessary to
          use the Services. Your mobile network&#39;s data and messaging rates
          and fees may apply if you access or use the Services from your device.
          You are responsible for acquiring and updating compatible hardware or
          devices necessary to access and use the Services and any updates
          thereto. Neynar does not guarantee that the Services, or any portion
          thereof, will function on any particular hardware or devices. In
          addition, the Services may be subject to malfunctions and delays
          inherent in the use of the Internet and electronic communications.
          Neynar reserves the right to modify, revise, or remove the Services we
          provide, including the Site and App, at Neynar’s sole discretion
          without notice. Neynar may restrict access to some parts of the
          Services. Neynar will not be liable for any outages to the Services
          that may occur, for whatever reason.
        </Para>
        <H2>Who May Use the Services?</H2>
        <Para>
          You may use the Services only if (1) you are 18 years or older (or the
          legal age of majority in your jurisdiction) or are between 13 years
          and 17 years old and your parent or legal guardian must agree to be
          bound by these Terms and (2) capable of forming a binding contract
          with Neynar, and are not barred from using the Services under
          applicable law. If you want to use certain features of the Services,
          you’ll have to create an account (“Account”). It’s important that you
          provide us with accurate, complete, and up-to-date information for
          your Account and you agree to update such information to keep it
          accurate, complete and up-to-date. If you don’t, we reserve the right
          to suspend or terminate your Account. You agree that you won’t
          disclose your Account login credentials to anyone and you’ll notify us
          immediately of any unauthorized use of your Account. You’re
          responsible for all activities that occur under your Account, whether
          or not you know about them.
        </Para>
        <Para>
          Neynar reserves the right to disable any account, username, password,
          functionality, or content at any time, in our sole discretion for any
          or no reason, including if, in our opinion, there has been a violation
          of any provision of these Terms or other posted policies, guidelines,
          or rules.
        </Para>
        <H2>Feedback</H2>
        <Para>
          We welcome feedback, comments and suggestions for improvements to the
          Services (“Feedback”). You can submit Feedback by emailing us at
          team+contact@neynar.com. You hereby grant to us a non-exclusive,
          transferable, worldwide, perpetual, irrevocable, sub-licensable
          (through multiple tiers), fully-paid, royalty-free license to use,
          copy, modify, create derivative works based upon, and otherwise
          exploit for any purpose the Feedback you provide us.
        </Para>
        <H2>Special Note for International Use; Export Control</H2>
        <Para>
          Neynar is headquartered in the United States. If you access or use the
          Services from outside of the United States, you do so at your own
          risk. Whether inside or outside of the United States, you are solely
          responsible for ensuring compliance with the laws of your specific
          jurisdiction. Software available in connection with the Services and
          the transmission of applicable data, if any, is subject to United
          States export controls. No software may be downloaded from the
          Services or otherwise exported or re-exported in violation of U.S.
          export laws. Downloading or using the software underlying the Services
          is at your sole risk.
        </Para>
        <H2>Content Ownership, Responsibility and Removal</H2>
        <Para>
          Definitions: For purposes of these Terms: (i) “Content” means text,
          graphics, images, music, software, audio, video, works of authorship
          of any kind, and information or other materials that are posted,
          generated, provided or otherwise made available through the Services;
          and (ii) “User Content” means any Content that Users (including you)
          provide to be made available through the Services including without
          limitation, any reviews, ratings, and comments you provide. For
          clarity, Content includes without limitation User Content.
        </Para>
        <Para>
          Our Content Ownership: Neynar does not claim any ownership rights in
          any User Content and nothing in these Terms will be deemed to restrict
          any rights that you may have to use and exploit your User Content.
          Subject to the foregoing, as between you and Neynar, Neynar is the
          sole owner of and will retain ownership of all right, title, and
          interest in the Services and Content, including all underlying
          software, algorithms, interfaces, technology, databases, tools,
          know-how, processes and methods used to provide or deliver the
          Services, documentation, aggregate data related to the Services, all
          improvements, modifications or enhancements to (or derivative works
          of) the foregoing (regardless of inventorship or authorship), and all
          Intellectual Property Rights in and to any of the foregoing. You
          acknowledge that the Services and Content are protected by copyright,
          trademark, and other laws of the United States and foreign countries.
          You agree not to remove, alter, or obscure any copyright, trademark,
          service mark or other proprietary rights notices incorporated in or
          accompanying the Services or Content.
        </Para>
        <Para>
          Rights in User Content Granted by You: By making any User Content
          available through the Services you hereby grant to Neynar a perpetual,
          irrevocable, non-exclusive, transferable, worldwide, royalty-free,
          fully paid license, with the right to sublicense (through multiple
          tiers), to use, copy, modify, create derivative works based upon,
          distribute, publicly display, and publicly perform your User Content
          in connection with operating and providing the Services.
        </Para>
        <Para>
          Your Responsibility for User Content: You are solely responsible for
          all your User Content. You represent and warrant that: (i) you own all
          your User Content or you have all rights that are necessary to grant
          us the license rights in your User Content under these Terms, and (ii)
          neither your User Content, nor your use and provision of your User
          Content to be made available through the Services, nor any use of your
          User Content by Neynar on or through the Services will infringe,
          misappropriate, or violate a third party’s intellectual property
          rights, or rights of publicity or privacy, or result in the violation
          of any applicable law or regulation.
        </Para>
        <Para>
          Rights in Content Granted by Neynar: Subject to your compliance with
          these Terms, Neynar grants you a limited, non-exclusive,
          non-transferable license, with no right to sublicense, to download,
          view, copy, display, and print the Content solely in connection with
          your permitted use of the Services and solely for your personal and
          non-commercial purposes.
        </Para>
        <Para>
          Third-Party Content: Under no circumstances will Neynar be liable in
          any way for any content or materials of any third parties (including
          Users), including for any errors or omissions in any Content, or for
          any loss or damage of any kind incurred as a result of the use of any
          such Content. You acknowledge that Neynar does not pre-screen Content,
          but that Neynar and its designees will have the right (but not the
          obligation) in their sole discretion to refuse or remove any Content
          that is available via the Services. Without limiting the foregoing,
          Neynar and its designees will have the right to remove any Content
          that violates these Terms or is deemed by Neynar, in its sole
          discretion, to be otherwise objectionable. You agree that you must
          evaluate, and bear all risks associated with, the use of any Content,
          including any reliance on the accuracy, completeness, or usefulness of
          such Content.
        </Para>
        <H2>Your Representations and Warranties</H2>
        <Para>
          By using the Services, you expressly represent and warrant that your
          use of the Services is solely for your personal use. When using the
          Services, you agree to comply with all applicable laws. By using the
          Services, you agree, represent, and warrant that:
        </Para>
        <ul className="bullets">
          <li>
            <Para>
              You are eligible to use the Services, based on the requirements
              outlined in the section entitled “Who May Use the Services.”
            </Para>
          </li>
          <li>
            <Para>
              You will only use the Services for lawful purposes, using only
              authorized means; you will not use the Services for sending or
              storing any unlawful material or communications or for deceptive
              or fraudulent purposes.
            </Para>
          </li>
          <li>
            <Para>
              You will not use the Services, or any Content accessible through
              the Services, for any commercial purpose, including but not
              limited to competing with Neynar services.
            </Para>
          </li>
          <li>
            <Para>
              You will not create or compile, directly or indirectly, any
              collection, compilation, or other directory from the Content
              displayed through the Services except for your personal,
              noncommercial use.
            </Para>
          </li>
          <li>
            <Para>
              You will keep secure and confidential your account password or any
              identification credentials we provide you which allows access to
              the Services.
            </Para>
          </li>
          <li>
            <Para>
              You will only use the Services for your own use and will not
              resell the Services to a third party.
            </Para>
          </li>
          <li>
            <Para>
              You will not conduct any systematic retrieval of data or other
              Content from the Services, and you will not copy any Content
              displayed through the Services for republication in any format or
              media.
            </Para>
          </li>
        </ul>
        <H2>General Prohibitions and Enforcement Rights</H2>
        <Para>You agree not to do any of the following:</Para>
        <ul className="bullets">
          <li>
            <Para>
              use, display, mirror or frame the Services or any individual
              element within the Services, Neynar’s name, any Neynar trademark,
              logo or other proprietary information, or the layout and design of
              any page or form contained on a page, without Neynar’s express
              written consent;
            </Para>
          </li>
          <li>
            <Para>
              use the Services in any manner that violates federal, state,
              local, or international law or regulation, including, without
              limitation, any laws regarding related to the export of data or
              software to and from the US or other countries;
            </Para>
          </li>
          <li>
            <Para>
              access, tamper with, or use non-public areas of the Services,
              Neynar’s computer systems, or the technical delivery systems of
              Neynar’s providers;
            </Para>
          </li>
          <li>
            <Para>
              impersonate or attempt to impersonate Neynar, a Neynar employee,
              contractor or agent, another User, or any other person or entity;
            </Para>
          </li>
          <li>
            <Para>
              attempt to probe, scan or test the vulnerability of any Neynar
              system or network or breach any security or authentication
              measures;
            </Para>
          </li>
          <li>
            <Para>
              avoid, bypass, remove, deactivate, impair, descramble or otherwise
              circumvent any technological measure implemented by Neynar or any
              of Neynar’s providers or any other third party (including another
              User) to protect the Services;
            </Para>
          </li>
          <li>
            <Para>
              use any robot, spider, or other automatic device, process, or
              means to access the Services for any purpose, including monitoring
              or copying any material on the Services;
            </Para>
          </li>
          <li>
            <Para>
              attempt to gain unauthorized access to, damage, disrupt, or
              interfere with any parts of the Services, or any server, computer
              or database connected to the Services;
            </Para>
          </li>
          <li>
            <Para>
              attempt to decipher, decompile, disassemble or reverse engineer
              the Services (including the App) or any of the software used to
              operate the Services;
            </Para>
          </li>
          <li>
            <Para>
              collect or store any personally identifiable information from the
              Services; and/or
            </Para>
          </li>
          <li>
            <Para>
              encourage or enable any other individual to do any of the
              foregoing.
            </Para>
          </li>
        </ul>
        <H2>Electronic Signatures</H2>
        <Para>
          For some activities related to the Services, Neynar may permit you to
          use a device equipped with an active connection to an internet service
          provider to access your Neynar accounts and policies, and to perform
          certain transactions as available. To facilitate this, you may be
          given the option to sign, consent to, or agree to certain documents
          including, but not limited to, these Terms, policies, quotes, updates,
          notifications, or other information that you request, transaction
          receipts, documents requiring your signature, or any other documents
          (“Communications”) electronically by either checking the appropriate
          box or engaging in a similar online process as instructed online. You
          agree that by checking the appropriate box within or adjacent to the
          applicable Communication or engaging in a similar online electronic
          consent process, you are providing your electronic signature and agree
          to be bound by the terms and provisions in such Communication just as
          if you had signed your name to a paper document.
        </Para>
        <H2>Copyright Policy</H2>
        <Para>
          Under the Digital Millennium Copyright Act of 1998 (the
          &quot;DMCA&quot;) if you believe in good faith that any content on the
          Services infringes your copyright, you may send us a notice requesting
          that the content be removed. The notice must include: (a) your (or
          your agent&#39;s) physical or electronic signature; (b) identification
          of the copyrighted work on our Site that is claimed to have been
          infringed (or a representative list if multiple copyrighted works are
          included in one notification); (c) identification of the content that
          is claimed to be infringing or the subject of infringing activity,
          including information reasonably sufficient to allow us to locate the
          content on the Services; (d) your name, address, telephone number and
          email address (if available); (e) a statement that you have a good
          faith belief that use of the content in the manner complained of is
          not authorized by you or your agent or the law; and (f) a statement
          that the information in the notification is accurate and, under
          penalty of perjury, that you or your agent is authorized to act on
          behalf of the copyright owner. You may read more information about the
          DMCA{' '}
          <ExternalLink href="http://www.copyright.gov/dmca" title="DMCA">
            here
          </ExternalLink>
          .
        </Para>
        <Para>
          If you believe that your User Content that was removed (or to which
          access was disabled) is not infringing, or that you have the
          authorization from the copyright owner, the copyright owner’s agent,
          or pursuant to the law, to upload and use the content in your User
          Content, you may send a written counter-notice containing the
          following information to the Copyright Agent (identified below): (a)
          your physical or electronic signature; (b) identification of the
          content that has been removed or to which access has been disabled and
          the location at which the content appeared before it was removed or
          disabled; (c) a statement that you have a good faith belief that the
          content was removed or disabled as a result of mistake or a
          misidentification of the content; and (d) your name, address,
          telephone number, and email address, a statement that you consent to
          the jurisdiction of the federal courts located within the state of
          California. and a statement that you will accept service of process
          from the person who provided notification of the alleged infringement.
        </Para>
        <Para>
          If a counter-notice is received by the Copyright Agent, Neynar will
          send a copy of the counter-notice to the original complaining party
          informing that person that it may replace the removed content or cease
          disabling it in 10 business days. Unless the copyright owner files an
          action seeking a court order against the content provider, member or
          User, the removed content may be replaced, or access to it restored,
          in 10 to 14 business days or more after receipt of the counter-notice,
          at our sole discretion.
        </Para>
        <Para>
          Notices and counter-notices should be sent to our Copyright Agent, at
          221 West 9th Street, Wilmington, DE 19801, Attn: Legal, or
          team+contact@neynar.com. There can be penalties for false claims under
          the DMCA. We suggest that you consult your legal advisor before filing
          a notice or counter-notice.
        </Para>
        <Para>
          In accordance with the DMCA and other applicable law, Neynar has
          adopted a policy of terminating, in appropriate circumstances and at
          Neynar’s sole discretion, Users who are deemed to be repeat
          infringers. Neynar may also at its sole discretion limit access to the
          Services and/or terminate the registrations of any Users who infringe
          any intellectual property rights of others, whether or not there is
          any repeat infringement.
        </Para>
        <Para>Disclaimers</Para>
        <Para>
          The following disclaimers are made on behalf of Neynar, our
          affiliates, subsidiaries, parents, successors and assigns, and each of
          our respective officers, directors, employees, agents, and
          shareholders. THE SERVICES ARE PROVIDED ON AN “AS IS” BASIS AND
          WITHOUT ANY WARRANTY OR CONDITION, EXPRESS, IMPLIED OR STATUTORY. WE
          DO NOT GUARANTEE AND DO NOT PROMISE ANY SPECIFIC RESULTS FROM USE OF
          THE SERVICES. TO THE FULLEST EXTENT PERMITTED BY LAW, WE SPECIFICALLY
          DISCLAIM ANY IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR
          A PARTICULAR PURPOSE AND NON-INFRINGEMENT. SOME STATES DO NOT ALLOW
          THE DISCLAIMER OF IMPLIED WARRANTIES, SO THE FOREGOING DISCLAIMER MAY
          NOT APPLY TO YOU. WE DO NOT WARRANT THAT YOUR USE OF THE SERVICES WILL
          BE ACCURATE, COMPLETE, RELIABLE, CURRENT, SECURE, UNINTERRUPTED,
          ALWAYS AVAILABLE, OR ERROR-FREE, OR WILL MEET YOUR REQUIREMENTS, THAT
          ANY DEFECTS IN THE SERVICES WILL BE CORRECTED, OR THAT THE SERVICES IS
          FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE DISCLAIM LIABILITY
          FOR, AND NO WARRANTY IS MADE WITH RESPECT TO, CONNECTIVITY AND
          AVAILABILITY OF THE SERVICES. WE ARE NOT RESPONSIBLE FOR ANY RESULTS
          OR ADVICE PROVIDED VIA THE SERVICES, AND DISCLAIM ALL LIABILITY WITH
          RESPECT THERETO.
        </Para>
        <H2>Indemnity</H2>
        <Para>
          To the extent permitted by law, you agree to indemnify, protect and
          hold Neynar and its parents, subsidiaries, affiliates, and assigns,
          and their respective officers, directors, employees, agents,
          representatives and service providers harmless from any and all
          claims, demands, damages, suits, losses, liabilities and causes of
          action (including without limitation, the cost of defense,
          attorneys&#39; fees, as well as the payment of any final judgment
          rendered against or settlement agreed upon by Neynar or its parent,
          subsidiary and/or affiliated companies) arising directly or indirectly
          from, as a result of, or in connection with: (i) your User Content;
          (ii) your failure to comply with any of these Terms; (iii) your
          violation of any applicable laws, rules, or regulations related to
          your use of the Services; and (iv) your use of the Services. Neynar
          reserves the right, at its own cost, to assume the exclusive defense
          and control of any matter otherwise subject to indemnification by you,
          in which event you will fully cooperate with Neynar in asserting any
          available defenses. Neynar will provide notice to you of any such
          claim, suit, or proceeding. Neynar reserves the right to assume the
          exclusive defense and control of any matter which is subject to
          indemnification under this section, and you agree to cooperate with
          any reasonable requests assisting Neynar’s defense of such matter. You
          may not settle or compromise any claim against the indemnified parties
          without Neynar’s written consent. If you are a California resident,
          you waive California Civil Code Section 1542, which says: “A general
          release does not extend to claims that the creditor or releasing party
          does not know or suspect to exist in his or her favor at the time of
          executing the release and that, if known by him or her, would have
          materially affected his or her settlement with the debtor or releasing
          party.” If you are a resident of another jurisdiction, you waive any
          comparable statute or doctrine.
        </Para>
        <H2>Limitation of Liability</H2>
        <Para>
          NEITHER NEYNAR NOR ANY OTHER PARTY INVOLVED IN CREATING, PRODUCING, OR
          DELIVERING THE SERVICES WILL BE LIABLE FOR ANY INCIDENTAL, SPECIAL,
          EXEMPLARY OR CONSEQUENTIAL DAMAGES, OR DAMAGES FOR LOST PROFITS, LOST
          REVENUES, LOST SAVINGS, LOST BUSINESS OPPORTUNITY, LOSS OF DATA OR
          GOODWILL, SERVICE INTERRUPTION, COMPUTER DAMAGE OR SYSTEM FAILURE OR
          THE COST OF SUBSTITUTE SERVICES OF ANY KIND ARISING OUT OF OR IN
          CONNECTION WITH THESE TERMS OR FROM YOUR USE OF, OR INABILITY TO USE,
          THE SERVICES, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING
          NEGLIGENCE), PRODUCT LIABILITY, OR ANY OTHER LEGAL THEORY, AND WHETHER
          OR NOT NEYNAR OR ANY OTHER PARTY HAS BEEN INFORMED OF THE POSSIBILITY
          OF SUCH DAMAGE, EVEN IF A LIMITED REMEDY SET FORTH HEREIN IS FOUND TO
          HAVE FAILED OF ITS ESSENTIAL PURPOSE. SOME JURISDICTIONS DO NOT ALLOW
          THE EXCLUSION OR LIMITATION OF LIABILITY FOR CONSEQUENTIAL OR
          INCIDENTAL DAMAGES, SO THE ABOVE LIMITATION MAY NOT APPLY TO YOU. IN
          NO EVENT WILL NEYNAR’S TOTAL LIABILITY ARISING OUT OF OR IN CONNECTION
          WITH THESE TERMS OR FROM THE USE OF OR INABILITY TO USE THE SERVICES
          EXCEED ONE HUNDRED US DOLLARS ($100). THE EXCLUSIONS AND LIMITATIONS
          OF DAMAGES SET FORTH ABOVE ARE FUNDAMENTAL ELEMENTS OF THE BASIS OF
          THE BARGAIN BETWEEN NEYNAR AND YOU.
        </Para>
        <Para>
          IF YOU ARE A USER FROM NEW JERSEY, THE FOREGOING SECTIONS TITLED
          “DISCLAIMERS”, “INDEMNITY” AND “LIMITATION OF LIABILITY” ARE INTENDED
          TO BE ONLY AS BROAD AS IS PERMITTED UNDER THE LAWS OF THE STATE OF NEW
          JERSEY. IF ANY PORTION OF THESE SECTIONS IS HELD TO BE INVALID UNDER
          THE LAWS OF THE STATE OF NEW JERSEY, THE INVALIDITY OF SUCH PORTION
          WILL NOT AFFECT THE VALIDITY OF THE REMAINING PORTIONS OF THE
          APPLICABLE SECTIONS.
        </Para>
        <H2>Jurisdictional Issues</H2>
        <Para>
          Neynar makes no representation that the Services are appropriate or
          available for use in your jurisdiction. If you choose to access the
          Services, you do so on your own initiative and are responsible for
          compliance with any applicable local, state, and federal laws, rules
          and regulations.
        </Para>
        <H2>Reliance on Information Posted</H2>
        <Para>
          The information presented throughout the Services is made available
          for general information purposes only. Neynar does not warrant the
          accuracy, completeness, or usefulness of the information. Any reliance
          you place on such information is at your own risk. We disclaim all
          liability and responsibility arising from any reliance placed on such
          materials by any visitor to, or User of, the Services, or by anyone
          who may be informed of any of its contents.
        </Para>
        <H2>User Disputes</H2>
        <Para>
          You agree that you are solely responsible for your interactions with
          any other user in connection with the Service, and Company will have
          no liability or responsibility with respect thereto. Company reserves
          the right, but has no obligation, to become involved in any way with
          disputes between you and any other user of the Service
        </Para>
        <H2>Links to Third Party Websites or Resources</H2>
        <Para>
          The Services may contain links to third-party websites or resources.
          We provide these links only as a convenience and are not responsible
          for the content, products, or services on or available from those
          websites or resources or links displayed on such websites. You
          acknowledge sole responsibility for and assume all risk arising from
          your use of any third-party websites or resources.
        </Para>
        <H2>Telecommunications Consent</H2>
        <Para>
          Notwithstanding any current or prior election to opt in or opt out of
          receiving telemarketing calls or SMS messages (including text
          messages) from Neynar or anyone calling on its behalf, you expressly
          consent to be contacted by Neynar and anyone calling on its behalf for
          any and all purposes arising out of or relating to this Agreement or
          your use of the Services, at any telephone number, or physical or
          electronic address you provide or at which you may be reached. You
          agree we may contact you in any way, including SMS messages (including
          text messages), calls using prerecorded messages or artificial voice,
          and calls and messages delivered using an auto-telephone dialing
          system or an automatic texting system. Automated messages may be
          played when the telephone is answered, whether by you or someone else.
          In the event that an agent or representative calls, he or she may also
          leave a message on your answering machine, voice mail, or send one via
          text. You consent to receive SMS messages (including text messages),
          calls and messages (including prerecorded and artificial voice and
          autodialed) from Neynar, its agents, representatives, affiliates or
          anyone calling on its behalf at the specific number(s) you have
          provided to Neynar, or numbers we can reasonably associate with your
          Account (through skip trace, caller ID capture or other means), with
          information or questions about your Account or use of the Services.
          You certify, warrant and represent that the telephone numbers that you
          have provided to us are your correct and current contact numbers. You
          represent that you are permitted to receive calls at each of the
          telephone numbers you have provided to us and agree to promptly alert
          us whenever you stop using a particular telephone number. Your
          cellular or mobile telephone provider will charge you according to the
          type of plan you carry. You also agree that we may contact you by
          email, using any email address you have provided to us or that you
          provide to us in the future. We may listen to and/or record phone
          calls between you and our representatives without notice to you as
          permitted by applicable law. For example, we may listen to and record
          calls for quality monitoring purposes. You consent to receive
          communications from us in electronic form should we so elect,
          including any and all disclosures and other communications that are
          required by law.{' '}
        </Para>
        <H2>Governing Law and Venue</H2>
        <Para>
          Except as otherwise provided in the Dispute Resolution provision
          below, these Terms will be governed by the laws of the State of
          California, without regard to its conflict of laws provisions. With
          respect to any disputes or claims not subject to arbitration, as set
          forth above, you and Company each hereby agree that each submit to the
          personal and exclusive jurisdiction of the state and federal courts
          located within the Northern District of California.
        </Para>
        <H2>Dispute Resolution by Binding Arbitration</H2>
        <Para>
          Please read this section carefully as it affects your rights.
        </Para>
        <Para>
          a. Agreement to Arbitrate. This Dispute Resolution by Binding
          Arbitration section is referred to in these Terms of Use as the
          “Arbitration Agreement.” You agree that any and all disputes or claims
          that have arisen or may arise between you and Company, whether arising
          out of or relating to these Terms of Use (including any alleged breach
          thereof), the Service, any advertising, or any aspect of the
          relationship or transactions between us, will be resolved exclusively
          through final and binding arbitration, rather than a court, in
          accordance with the terms of this Arbitration Agreement, except that
          you may assert individual claims in small claims court, if your claims
          qualify. Further, this Arbitration Agreement does not preclude you
          from bringing issues to the attention of federal, state, or local
          agencies, and such agencies can, if the law allows, seek relief
          against us on your behalf. You agree that, by entering into these
          Terms of Use, you and Company are each waiving the right to a trial by
          jury or to participate in a class action. Your rights will be
          determined by a neutral arbitrator, not a judge or jury. The Federal
          Arbitration Act governs the interpretation and enforcement of this
          Arbitration Agreement.
        </Para>
        <Para>
          b. Prohibition of Class and Representative Actions and
          Non-Individualized Relief. YOU AND COMPANY AGREE THAT EACH OF US MAY
          BRING CLAIMS AGAINST THE OTHER ONLY ON AN INDIVIDUAL BASIS AND NOT AS
          A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE
          ACTION OR PROCEEDING. UNLESS BOTH YOU AND COMPANY AGREE OTHERWISE, THE
          ARBITRATOR MAY NOT CONSOLIDATE OR JOIN MORE THAN ONE PERSON’S OR
          PARTY’S CLAIMS AND MAY NOT OTHERWISE PRESIDE OVER ANY FORM OF A
          CONSOLIDATED, REPRESENTATIVE, OR CLASS PROCEEDING. ALSO, THE
          ARBITRATOR MAY AWARD RELIEF (INCLUDING MONETARY, INJUNCTIVE, AND
          DECLARATORY RELIEF) ONLY IN FAVOR OF THE INDIVIDUAL PARTY SEEKING
          RELIEF AND ONLY TO THE EXTENT NECESSARY TO PROVIDE RELIEF NECESSITATED
          BY THAT PARTY’S INDIVIDUAL CLAIM(S), EXCEPT THAT YOU MAY PURSUE A
          CLAIM FOR AND THE ARBITRATOR MAY AWARD PUBLIC INJUNCTIVE RELIEF UNDER
          APPLICABLE LAW TO THE EXTENT REQUIRED FOR THE ENFORCEABILITY OF THIS
          PROVISION.
        </Para>
        <Para>
          c. Pre-Arbitration Dispute Resolution. Company is always interested in
          resolving disputes amicably and efficiently, and most customer
          concerns can be resolved quickly and to the customer’s satisfaction by
          emailing customer support at team+contact@neynar.com. If such efforts
          prove unsuccessful, a party who intends to seek arbitration must first
          send to the other, by certified mail, a written Notice of Dispute
          (“Notice”). The Notice to Company should be sent to Neynar, Inc. 221
          West 9th Street, Wilmington, DE 19801 (“Notice Address”). The Notice
          must (i) describe the nature and basis of the claim or dispute and
          (ii) set forth the specific relief sought. If Company and you do not
          resolve the claim within sixty (60) calendar days after the Notice is
          received, you or Company may commence an arbitration proceeding.
          During the arbitration, the amount of any settlement offer made by
          Company or you will not be disclosed to the arbitrator until after the
          arbitrator determines the amount, if any, to which you or Company is
          entitled.
        </Para>
        <Para>
          d. Arbitration Procedures. Arbitration will be conducted by a neutral
          arbitrator in accordance with the American Arbitration Association’s
          (“AAA”) rules and procedures, including the AAA’s Consumer Arbitration
          Rules (collectively, the “AAA Rules”), as modified by this Arbitration
          Agreement. For information on the AAA, please visit its website,{' '}
          <ExternalLink
            href="http://www.adr.org"
            title="American Arbitration Association"
          >
            http://www.adr.org
          </ExternalLink>
          . Information about the AAA Rules and fees for consumer disputes can
          be found at the AAA’s consumer arbitration page,{' '}
          <ExternalLink
            href="https://www.adr.org/consumer"
            title="American Arbitration Association rules"
          >
            https://www.adr.org/consumer
          </ExternalLink>
          . If there is any inconsistency between any term of the AAA Rules and
          any term of this Arbitration Agreement, the applicable terms of this
          Arbitration Agreement will control unless the arbitrator determines
          that the application of the inconsistent Arbitration Agreement terms
          would not result in a fundamentally fair arbitration. The arbitrator
          must also follow the provisions of these Terms of Use as a court
          would. All issues are for the arbitrator to decide, including issues
          relating to the scope, enforceability, and arbitrability of this
          Arbitration Agreement. Although arbitration proceedings are usually
          simpler and more streamlined than trials and other judicial
          proceedings, the arbitrator can award the same damages and relief on
          an individual basis that a court can award to an individual under
          these Terms of Use and applicable law. Decisions by the arbitrator are
          enforceable in court and may be overturned by a court only for very
          limited reasons. Unless Company and you agree otherwise, any
          arbitration hearings will take place in a reasonably convenient
          location for both parties with due consideration of their ability to
          travel and other pertinent circumstances. If the parties are unable to
          agree on a location, the determination will be made by AAA. If your
          claim is for $10,000 or less, Company agrees that you may choose
          whether the arbitration will be conducted solely on the basis of
          documents submitted to the arbitrator, through a telephonic hearing,
          or by an in-person hearing as established by the AAA Rules. If your
          claim exceeds $10,000, the right to a hearing will be determined by
          the AAA Rules. Regardless of the manner in which the arbitration is
          conducted, the arbitrator will issue a reasoned written decision
          sufficient to explain the essential findings and conclusions on which
          the award is based.
        </Para>
        <Para>
          e. Costs of Arbitration. Payment of all filing, administration, and
          arbitrator fees (collectively, the “Arbitration Fees”) will be
          governed by the AAA Rules, unless otherwise provided in this
          Arbitration Agreement. If the value of the relief sought is $75,000 or
          less, at your request, Company will pay all Arbitration Fees. If the
          value of relief sought is more than $75,000 and you are able to
          demonstrate to the arbitrator that you are economically unable to pay
          your portion of the Arbitration Fees or if the arbitrator otherwise
          determines for any reason that you should not be required to pay your
          portion of the Arbitration Fees, Company will pay your portion of such
          fees. In addition, if you demonstrate to the arbitrator that the costs
          of arbitration will be prohibitive as compared to the costs of
          litigation, Company will pay as much of the Arbitration Fees as the
          arbitrator deems necessary to prevent the arbitration from being
          cost-prohibitive. Any payment of attorneys’ fees will be governed by
          the AAA Rules.
        </Para>
        <Para>
          f. Confidentiality. All aspects of the arbitration proceeding, and any
          ruling, decision, or award by the arbitrator, will be strictly
          confidential for the benefit of all parties.
        </Para>
        <Para>
          g. Severability. If a court or the arbitrator decides that any term or
          provision of this Arbitration Agreement (other than the subsection (b)
          above titled “Prohibition of Class and Representative Actions and
          Non-Individualized Relief” above) is invalid or unenforceable, the
          parties agree to replace such term or provision with a term or
          provision that is valid and enforceable and that comes closest to
          expressing the intention of the invalid or unenforceable term or
          provision, and this Arbitration Agreement will be enforceable as so
          modified. If a court or the arbitrator decides that any of the
          provisions of subsection (b) above titled “Prohibition of Class and
          Representative Actions and Non-Individualized Relief” are invalid or
          unenforceable, then the entirety of this Arbitration Agreement will be
          null and void, unless such provisions are deemed to be invalid or
          unenforceable solely with respect to claims for public injunctive
          relief. The remainder of these Terms of Use will continue to apply.
        </Para>
        <Para>
          h. Future Changes to Arbitration Agreement. Notwithstanding any
          provision in these Terms of Use to the contrary, Company agrees that
          if it makes any future change to this Arbitration Agreement (other
          than a change to the Notice Address) while you are a user of the
          Service, you may reject any such change by sending Company written
          notice within thirty (30) calendar days of the change to the Notice
          Address provided above. By rejecting any future change, you are
          agreeing that you will arbitrate any dispute between us in accordance
          with the language of this Arbitration Agreement as of the date you
          first accepted these Terms of Use (or accepted any subsequent changes
          to these Terms of Use).
        </Para>
        <H2>Termination</H2>
        <Para>
          You agree that Company, in its sole discretion, may suspend or
          terminate your account (or any part thereof) or use of the Service and
          remove and discard any content within the Service, for any reason,
          including for lack of use or if Company believes that you have
          violated or acted inconsistently with the letter or spirit of these
          Terms of Use. Any suspected fraudulent, abusive, or illegal activity
          that may be grounds for termination of your use of the Service, may be
          referred to appropriate law enforcement authorities. Company may also
          in its sole discretion and at any time discontinue providing the
          Service, or any part thereof, with or without notice. You agree that
          any termination of your access to the Service under any provision of
          these Terms of Use may be effected without prior notice, and
          acknowledge and agree that Company may immediately deactivate or
          delete your account and all related information and files in your
          account and/or bar any further access to such files or the Service.
          Further, you agree that Company will not be liable to you or any third
          party for any termination of your access to the Service.
        </Para>
        <H2>Notices</H2>
        <Para>
          Any notices or other communications provided by Neynar under these
          Terms, including those regarding modifications to these Terms, will be
          given: (i) via email; or (ii) by posting to the Services. For notices
          made by e-mail, the date of receipt will be deemed the date on which
          such notice is transmitted.
        </Para>
        <H2>Waiver of Rights</H2>
        <Para>
          Neynar’s failure to enforce any right or provision of these Terms will
          not be considered a waiver of such right or provision. The waiver of
          any such right or provision will be effective only if in writing and
          signed by a duly authorized representative of Neynar. Except as
          expressly set forth in these Terms, the exercise by either party of
          any of its remedies under these Terms will be without prejudice to its
          other remedies under these Terms or otherwise.
        </Para>
        <H2>Entire Terms</H2>
        <Para>
          Except as otherwise stated herein or otherwise amended and agreed to
          by you and Neynar, these Terms constitute the entire and exclusive
          understanding and agreement between Neynar and you regarding your use
          of the Services, and these Terms supersede and replace any and all
          prior oral or written understandings or agreements between Neynar and
          you regarding the use of the Services. If any provision of these Terms
          is held invalid or unenforceable by an arbitrator or a court of
          competent jurisdiction, that provision will be enforced to the maximum
          extent permissible and the other provisions of these Terms will remain
          in full force and effect - except as otherwise described in Dispute
          Resolution by Binding Arbitration section. You may not assign or
          transfer these Terms, by operation of law or otherwise, without
          Neynar’s prior written consent. Any attempt by you to assign or
          transfer these Terms, without such consent, will have no legal effect.
          Neynar may freely assign or transfer these Terms without restriction.
          Subject to the foregoing, these Terms will bind and inure to the
          benefit of the parties, their successors and permitted assigns.
        </Para>
        <H2>Notice for California Users</H2>
        <Para>
          Under California Civil Code Section 1789.3, users of the Service from
          California are entitled to the following specific consumer rights
          notice: The Complaint Assistance Unit of the Division of Consumer
          Services of the California Department of Consumer Affairs may be
          contacted (a) via email at{' '}
          <ExternalLink
            href="mailto:dca@dca.ca.gov"
            title="Email Complaint Assistance Unit of the Division of Consumer
          Services of the California Department of Consumer Affairs"
          >
            dca@dca.ca.gov
          </ExternalLink>
          ; (b) in writing at: Department of Consumer Affairs, Consumer
          Information Division, 1625 North Market Blvd., Suite N 112,
          Sacramento, CA 95834; or (c) by telephone at (800) 952-5210 or (800)
          326-2297 (TDD). Sacramento-area consumers may call (916) 445-1254 or
          (916) 928-1227 (TDD). You may contact us at team+contact@neynar.com.
        </Para>
        <H2>U.S. Government Restricted Rights</H2>
        <Para>
          The Services are made available to the U.S. government with
          “RESTRICTED RIGHTS.” Use, duplication, or disclosure by the U.S.
          government is subject to the restrictions contained in 48 CFR
          52.227-19 and 48 CFR 252.227-7013 et seq. or its successor. Access or
          use of the Services (including the software that enables the Services)
          by the U.S. government constitutes acknowledgement of our proprietary
          rights in the Services (including such software).
        </Para>
        <H2>Employment Opportunities</H2>
        <Para>
          Neynar is committed to the principles of equal employment opportunity.
          Applications are considered for all positions without regard to race,
          sex, sexual orientation, ethnicity, religion, national origin, age,
          disability (so long as such disability can be reasonably
          accommodated), or any other status protected by applicable law. Neynar
          encourages all qualified applicants to apply.
        </Para>
        <H2>Google Maps Platform</H2>
        <Para>
          By agreeing to these Terms of Service, you are also agreeing to the{' '}
          <ExternalLink
            href="https://cloud.google.com/maps-platform/terms/"
            title="Google Maps Platform Terms of Service"
          >
            Google Maps Platform Terms of Service
          </ExternalLink>
          .
        </Para>
        <H2>Contact Us</H2>
        <Para>
          If you have any questions about these Terms or the Services, please
          contact us at:{' '}
          <ExternalLink
            href="mailto:team+contact@neynar.com"
            title="Email Neynar"
          >
            team+contact@neynar.com
          </ExternalLink>
          .
        </Para>
      </div>
    </StandalonePage>
  );
});

TermsOfUsePage.displayName = 'TermsOfUsePage';

export { TermsOfUsePage };
