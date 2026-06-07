import { useState } from "react";

interface CertificateProps {
  onRestart: () => void;
}

export function Certificate({ onRestart }: CertificateProps) {
  const [name, setName] = useState("");
  const [showCert, setShowCert] = useState(false);

  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (showCert) {
    return (
      <>
        <style>{`
          @media print {
            body > *:not(#cert-root) { display: none !important; }
            #cert-root { display: block !important; }
            #certificate {
              position: static;
              width: 100%;
              max-width: none;
              border: none !important;
              box-shadow: none !important;
              margin: 0;
              padding: 1cm;
            }
          }
        `}</style>

        <div id="cert-root" className="flex flex-col items-center gap-6 w-full">
          <div
            id="certificate"
            className="flex flex-col items-center gap-6 text-center max-w-2xl w-full mx-auto p-8 border border-zinc-200 dark:border-zinc-700 rounded-2xl"
          >
            <p className="text-sm text-zinc-400">
              بسم الله الرحمن الرحيم
            </p>

            <h2 className="text-2xl font-semibold">
              Certificate of Faith
            </h2>

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This certifies that
            </p>

            <p className="text-3xl font-semibold">{name}</p>

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              has sincerely recited the Shahada
            </p>

            <div className="w-full border-t border-zinc-200 dark:border-zinc-700 pt-6">
              <p
                className="text-2xl leading-relaxed"
                style={{ fontFamily: '"Noto Naskh Arabic", serif' }}
              >
                أشهد أن لا إله إلا الله
              </p>
              <p
                className="text-2xl leading-relaxed mt-2"
                style={{ fontFamily: '"Noto Naskh Arabic", serif' }}
              >
                وأشهد أن محمداً رسول الله
              </p>
            </div>

            <p className="text-sm text-zinc-400">{date}</p>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-6 py-2 rounded-full bg-ink text-white dark:bg-white dark:text-ink text-sm font-medium"
            >
              Print / Save as PDF
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="px-6 py-2 rounded-full border border-zinc-300 dark:border-zinc-600 text-sm font-medium"
            >
              Practice again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="max-w-sm text-md font-medium text-ink dark:text-white">
        Enter your name to generate your certificate
      </p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) =>
          e.key === "Enter" && name.trim() && setShowCert(true)
        }
        placeholder="Your name"
        className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-600 bg-transparent text-center text-sm outline-none w-48"
      />

      <button
        type="button"
        onClick={() => name.trim() && setShowCert(true)}
        disabled={!name.trim()}
        className="px-6 py-2 rounded-full bg-ink text-white dark:bg-white dark:text-ink text-sm font-medium disabled:opacity-40"
      >
        Generate certificate
      </button>
    </div>
  );
}
