# 🍰 Poptávka dortu - Cukrářství Blahutovi

Moderní webová aplikace pro zakázkovou výrobu dortů s integrací umělé inteligence. Aplikace umožňuje zákazníkům nahrávat předlohy, konfigurovat parametry dortu a automaticky generovat objednávky.

## ✨ Klíčové Funkce

- **AI Analýza Předlohy**: Využívá Google Gemini API k analýze nahrané fotografie dortu, detekci tvaru a barev.
- **Multiupload**: Možnost nahrát až 5 fotografií předlohy.
- **Jedlý Tisk**: Podpora pro nahrávání obrázků pro tisk na jedlý papír.
- **Interaktivní Konfigurátor**:
  - Dynamický výběr pater a průměrů.
  - Specifické možnosti pro různé tvary (Kulatý, Čtverec, Obdélník, Srdce).
  - Výběr příchutí, korpusů a povrchových úprav (s výběrem barev a stylů).
- **Kalendář**: Chytrý výběr data vyzvednutí s vyloučením svátků a minimální lhůtou pro výrobu (7 dní).
- **Generování E-mailu**: Automatické sestavení `mailto` odkazu s kompletním shrnutím objednávky.

## 🛠️ Technologie

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini SDK (@google/genai)
- **Icons**: Lucide React

## 🚀 Spuštění

Tento projekt využívá moderní ES Modules a import mapy přes CDN. Pro spuštění není nutný build step (např. Webpack/Vite), ale je potřeba lokální server.

### Prerekvizity

- API Klíč pro Google Gemini (nastaven v prostředí jako `API_KEY`).

### Lokální vývoj

1. Otevřete složku projektu.
2. Spusťte libovolný statický server (např. rozšíření "Live Server" ve VS Code nebo `npx serve`).
3. Otevřete `index.html`.

## 📦 Struktura Projektu

- `/components` - React komponenty (Steps, Calendar).
- `/services` - Logika pro komunikaci s AI.
- `App.tsx` - Hlavní logika formuláře a stavu aplikace.
- `types.ts` & `constants.ts` - Definice typů a konfigurační data (ceny, rozměry, prodejny).

## 📝 Poznámky

Při odesílání objednávky s **jedlým tiskem** je zákazník v e-mailu upozorněn, aby přiložil soubor jako přílohu, jelikož prohlížeč nemůže automaticky přikládat soubory do `mailto` odkazů.