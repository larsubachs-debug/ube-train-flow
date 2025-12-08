import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  const { t, i18n } = useTranslation();
  const isNL = i18n.language === 'nl';

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/account">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {isNL ? 'Privacybeleid' : 'Privacy Policy'}
          </h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            {isNL ? 'Laatst bijgewerkt: December 2024' : 'Last updated: December 2024'}
          </p>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '1. Inleiding' : '1. Introduction'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'Welkom bij U.be Training. Wij respecteren uw privacy en zetten ons in om uw persoonlijke gegevens te beschermen. Dit privacybeleid legt uit hoe wij uw informatie verzamelen, gebruiken en beschermen.'
                : 'Welcome to U.be Training. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and protect your information.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '2. Gegevens die we verzamelen' : '2. Data We Collect'}
            </h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>{isNL ? 'Accountgegevens: e-mailadres, naam, profielfoto' : 'Account information: email address, name, profile photo'}</li>
              <li>{isNL ? 'Trainingsgegevens: workouts, sets, gewichten, voortgang' : 'Training data: workouts, sets, weights, progress'}</li>
              <li>{isNL ? 'Lichaamsmetingen: gewicht, vetpercentage, foto\'s' : 'Body metrics: weight, body fat percentage, photos'}</li>
              <li>{isNL ? 'Communicatie: berichten met je coach' : 'Communications: messages with your coach'}</li>
              <li>{isNL ? 'Apparaatgegevens: app-gebruik, apparaattype' : 'Device data: app usage, device type'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '3. Hoe we uw gegevens gebruiken' : '3. How We Use Your Data'}
            </h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>{isNL ? 'Om onze trainingsapp te leveren en te verbeteren' : 'To provide and improve our training app'}</li>
              <li>{isNL ? 'Om uw voortgang en statistieken bij te houden' : 'To track your progress and statistics'}</li>
              <li>{isNL ? 'Om communicatie tussen u en uw coach mogelijk te maken' : 'To enable communication between you and your coach'}</li>
              <li>{isNL ? 'Om u meldingen te sturen over workouts en taken' : 'To send you notifications about workouts and tasks'}</li>
              <li>{isNL ? 'Om de app te personaliseren naar uw voorkeuren' : 'To personalize the app to your preferences'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '4. Gegevensbeveiliging' : '4. Data Security'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'Wij implementeren passende technische en organisatorische maatregelen om uw persoonlijke gegevens te beschermen tegen ongeoorloofde toegang, wijziging, openbaarmaking of vernietiging. Al uw gegevens worden versleuteld opgeslagen en veilig verzonden.'
                : 'We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. All your data is stored encrypted and transmitted securely.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '5. Uw rechten' : '5. Your Rights'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'U heeft het recht om: toegang te vragen tot uw gegevens, correctie te verzoeken, verwijdering aan te vragen, verwerking te beperken, en uw gegevens over te dragen. Neem contact met ons op via de app om deze rechten uit te oefenen.'
                : 'You have the right to: request access to your data, request correction, request deletion, restrict processing, and transfer your data. Contact us through the app to exercise these rights.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '6. Gegevensbewaring' : '6. Data Retention'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'Wij bewaren uw persoonlijke gegevens zolang uw account actief is. Bij accountverwijdering worden uw gegevens binnen 30 dagen permanent verwijderd.'
                : 'We retain your personal data as long as your account is active. Upon account deletion, your data will be permanently deleted within 30 days.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '7. Delen met derden' : '7. Third-Party Sharing'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'Wij delen uw gegevens niet met derden voor marketingdoeleinden. Wij kunnen gegevens delen met dienstverleners die ons helpen de app te leveren (hosting, analytics), altijd onder strikte geheimhoudingsvoorwaarden.'
                : 'We do not share your data with third parties for marketing purposes. We may share data with service providers who help us deliver the app (hosting, analytics), always under strict confidentiality terms.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '8. Contactgegevens' : '8. Contact Information'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'Voor vragen over dit privacybeleid of uw gegevens, neem contact op via de chat-functie in de app of stuur een e-mail naar privacy@ube-training.com.'
                : 'For questions about this privacy policy or your data, contact us through the chat feature in the app or email privacy@ube-training.com.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '9. Wijzigingen in dit beleid' : '9. Changes to This Policy'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'Wij kunnen dit privacybeleid van tijd tot tijd bijwerken. Wij zullen u op de hoogte stellen van belangrijke wijzigingen via de app of per e-mail.'
                : 'We may update this privacy policy from time to time. We will notify you of significant changes through the app or by email.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
