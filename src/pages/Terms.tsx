import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Terms = () => {
  const { i18n } = useTranslation();
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
            {isNL ? 'Gebruiksvoorwaarden' : 'Terms of Service'}
          </h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            {isNL ? 'Laatst bijgewerkt: December 2024' : 'Last updated: December 2024'}
          </p>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '1. Acceptatie van voorwaarden' : '1. Acceptance of Terms'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'Door U.be Training te gebruiken, accepteert u deze gebruiksvoorwaarden. Als u niet akkoord gaat met deze voorwaarden, gebruik de app dan niet.'
                : 'By using U.be Training, you accept these terms of service. If you do not agree to these terms, do not use the app.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '2. Beschrijving van de dienst' : '2. Description of Service'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'U.be Training is een fitness-app die trainingsschema\'s, voortgangsregistratie en coaching-communicatie biedt. De app is bedoeld voor persoonlijk gebruik onder begeleiding van een gecertificeerde coach.'
                : 'U.be Training is a fitness app that provides workout programs, progress tracking, and coaching communication. The app is intended for personal use under the guidance of a certified coach.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '3. Gebruikersaccount' : '3. User Account'}
            </h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>{isNL ? 'U bent verantwoordelijk voor het geheimhouden van uw accountgegevens' : 'You are responsible for keeping your account credentials confidential'}</li>
              <li>{isNL ? 'U moet nauwkeurige informatie verstrekken bij registratie' : 'You must provide accurate information during registration'}</li>
              <li>{isNL ? 'U mag uw account niet delen met anderen' : 'You may not share your account with others'}</li>
              <li>{isNL ? 'U moet minimaal 16 jaar oud zijn om de app te gebruiken' : 'You must be at least 16 years old to use the app'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '4. Gezondheidsvoorwaarden' : '4. Health Disclaimer'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'De trainingsadviezen in deze app zijn algemeen van aard. Raadpleeg altijd een arts voordat u aan een nieuw trainingsprogramma begint, vooral als u gezondheidsproblemen heeft. Wij zijn niet aansprakelijk voor blessures die voortvloeien uit het gebruik van de app.'
                : 'The training advice in this app is general in nature. Always consult a doctor before starting a new training program, especially if you have health issues. We are not liable for injuries resulting from use of the app.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '5. Intellectueel eigendom' : '5. Intellectual Property'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'Alle content in de app, inclusief trainingsprogramma\'s, teksten, afbeeldingen en software, is eigendom van U.be Training en mag niet worden gekopieerd of gedistribueerd zonder toestemming.'
                : 'All content in the app, including training programs, texts, images, and software, is owned by U.be Training and may not be copied or distributed without permission.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '6. Verboden gedrag' : '6. Prohibited Conduct'}
            </h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>{isNL ? 'De app niet gebruiken voor illegale doeleinden' : 'Do not use the app for illegal purposes'}</li>
              <li>{isNL ? 'Geen spam of ongepaste content versturen' : 'Do not send spam or inappropriate content'}</li>
              <li>{isNL ? 'Niet proberen de app te hacken of te verstoren' : 'Do not attempt to hack or disrupt the app'}</li>
              <li>{isNL ? 'De app niet reverse-engineeren' : 'Do not reverse-engineer the app'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '7. Beëindiging' : '7. Termination'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'Wij kunnen uw account beëindigen of opschorten bij overtreding van deze voorwaarden. U kunt uw account op elk moment verwijderen via de accountinstellingen.'
                : 'We may terminate or suspend your account for violation of these terms. You can delete your account at any time through account settings.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '8. Beperking van aansprakelijkheid' : '8. Limitation of Liability'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'U.be Training is niet aansprakelijk voor indirecte, incidentele of gevolgschade die voortvloeit uit het gebruik van de app. Onze totale aansprakelijkheid is beperkt tot het bedrag dat u heeft betaald voor de dienst.'
                : 'U.be Training is not liable for indirect, incidental, or consequential damages arising from use of the app. Our total liability is limited to the amount you paid for the service.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '9. Wijzigingen' : '9. Changes'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'Wij kunnen deze voorwaarden wijzigen. Bij belangrijke wijzigingen worden gebruikers op de hoogte gesteld. Voortgezet gebruik na wijzigingen betekent acceptatie.'
                : 'We may modify these terms. Users will be notified of significant changes. Continued use after changes constitutes acceptance.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              {isNL ? '10. Toepasselijk recht' : '10. Governing Law'}
            </h2>
            <p className="text-muted-foreground">
              {isNL 
                ? 'Deze voorwaarden worden beheerst door Nederlands recht. Geschillen worden voorgelegd aan de bevoegde rechtbank in Nederland.'
                : 'These terms are governed by Dutch law. Disputes will be submitted to the competent court in the Netherlands.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
