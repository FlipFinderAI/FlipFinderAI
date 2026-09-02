import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const LANGUAGE_KEY = "ticket-frame.language.v1";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", welcome: "Welcome" },
  { code: "es", label: "Español", welcome: "Bienvenido" },
  { code: "fr", label: "Français", welcome: "Bienvenue" },
  { code: "de", label: "Deutsch", welcome: "Willkommen" },
  { code: "it", label: "Italiano", welcome: "Benvenuto" },
  { code: "pt", label: "Português", welcome: "Bem-vindo" },
  { code: "nl", label: "Nederlands", welcome: "Welkom" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {},
  es: {
    Continue: "Continuar", Language: "Idioma", Country: "País", League: "Liga",
    "Favourite team": "Equipo favorito", Settings: "Ajustes", Home: "Inicio", "My Club": "Mi club", Stadiums: "Estadios", "Back to Home": "Volver al inicio", "League Table": "Clasificación",
    Fixtures: "Partidos", History: "Historial", Grounds: "Estadios",
    "Privacy & important information": "Privacidad e información importante",
    "I accept": "Acepto", "Search clubs…": "Buscar clubes…",
  },
  fr: {
    Continue: "Continuer", Language: "Langue", Country: "Pays", League: "Ligue",
    "Favourite team": "Équipe favorite", Settings: "Réglages", Home: "Accueil", "My Club": "Mon club", Stadiums: "Stades", "Back to Home": "Retour à l’accueil", "League Table": "Classement",
    Fixtures: "Matchs", History: "Historique", Grounds: "Stades",
    "Privacy & important information": "Confidentialité et informations importantes",
    "I accept": "J’accepte", "Search clubs…": "Rechercher un club…",
  },
  de: {
    Continue: "Weiter", Language: "Sprache", Country: "Land", League: "Liga",
    "Favourite team": "Lieblingsverein", Settings: "Einstellungen", Home: "Start", "My Club": "Mein Verein", Stadiums: "Stadien", "Back to Home": "Zur Startseite", "League Table": "Tabelle",
    Fixtures: "Spiele", History: "Verlauf", Grounds: "Stadien",
    "Privacy & important information": "Datenschutz und wichtige Hinweise",
    "I accept": "Ich stimme zu", "Search clubs…": "Vereine suchen…",
  },
  it: {
    Continue: "Continua", Language: "Lingua", Country: "Paese", League: "Campionato",
    "Favourite team": "Squadra preferita", Settings: "Impostazioni", Home: "Home", "My Club": "La mia squadra", Stadiums: "Stadi", "Back to Home": "Torna alla Home", "League Table": "Classifica",
    Fixtures: "Partite", History: "Cronologia", Grounds: "Stadi",
    "Privacy & important information": "Privacy e informazioni importanti",
    "I accept": "Accetto", "Search clubs…": "Cerca squadre…",
  },
  pt: {
    Continue: "Continuar", Language: "Idioma", Country: "País", League: "Liga",
    "Favourite team": "Equipa favorita", Settings: "Definições", Home: "Início", "My Club": "O meu clube", Stadiums: "Estádios", "Back to Home": "Voltar ao início", "League Table": "Classificação",
    Fixtures: "Jogos", History: "Histórico", Grounds: "Estádios",
    "Privacy & important information": "Privacidade e informações importantes",
    "I accept": "Aceito", "Search clubs…": "Pesquisar clubes…",
  },
  nl: {
    Continue: "Doorgaan", Language: "Taal", Country: "Land", League: "Competitie",
    "Favourite team": "Favoriete club", Settings: "Instellingen", Home: "Home", "My Club": "Mijn club", Stadiums: "Stadions", "Back to Home": "Terug naar home", "League Table": "Stand",
    Fixtures: "Wedstrijden", History: "Historie", Grounds: "Stadions",
    "Privacy & important information": "Privacy en belangrijke informatie",
    "I accept": "Ik ga akkoord", "Search clubs…": "Clubs zoeken…",
  },
};

export function suggestedLanguage(): LanguageCode {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  const prefix = locale.split(/[-_]/)[0] as LanguageCode;
  return SUPPORTED_LANGUAGES.some((language) => language.code === prefix)
    ? prefix
    : "en";
}

type LanguageContextValue = {
  language: LanguageCode;
  ready: boolean;
  setLanguage: (language: LanguageCode) => void;
  t: (english: string) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  ready: false,
  setLanguage: () => {},
  t: (english) => english,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(suggestedLanguage);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => {
        if (SUPPORTED_LANGUAGES.some((item) => item.code === stored))
          setLanguageState(stored as LanguageCode);
      })
      .finally(() => setReady(true));
  }, []);

  const setLanguage = useCallback((next: LanguageCode) => {
    setLanguageState(next);
    void AsyncStorage.setItem(LANGUAGE_KEY, next);
  }, []);
  const t = useCallback(
    (english: string) => translations[language][english] ?? english,
    [language],
  );
  const value = useMemo(
    () => ({ language, ready, setLanguage, t }),
    [language, ready, setLanguage, t],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
