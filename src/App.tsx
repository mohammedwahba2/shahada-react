import { Header } from "./components/Header";
import { VisualizerOrb } from "./components/VisualizerOrb";
import { Button } from "./components/Button";
import { RecitePrompt } from "./components/RecitePrompt";
import { Certificate } from "./components/Certificate";
import { IntroFlow } from "./components/IntroFlow";
import { MatchedWordsDisplay } from "./components/MatchedWordsDisplay";
import { TextInputFallback } from "./components/TextInputFallback";

import { useRecitationSession } from "./hooks/useRecitationSession";


const App = () => {
  const {
    isRecording,
    isComplete,
    showCertificate,
    isOnline,
    hasSupport,
    steps,
    currentStep,
    orbMode,
    volumeRef,
    transcript,
    display,
    subtitle,
    statusMessage,
    textInput,
    showTextFallback,
    textFlowStarted,
    setTextInput,
    handleStart,
    handleStop,
    handleRestart,
    handleTextSubmit,
    handlePromptSpeechStart,
    handlePromptSpeechEnd,
  } = useRecitationSession();

  return (
    <div className="flex min-h-full flex-col bg-white text-ink dark:bg-ink dark:text-white">
      <Header />

      {/* Offline banner */}
      {!isOnline && (
        <div className="w-full bg-red-500 text-white text-center py-2 text-sm">
          You are offline. Speech recognition requires an internet connection.
        </div>
      )}

      <main
        id="main-content"
        className="flex flex-1 flex-col items-center px-4 pb-16 pt-12 sm:px-6 sm:pt-40 lg:px-8"
      >
        <div className="flex w-full max-w-2xl flex-1 flex-col items-center text-center">
          <h1 className="text-4xl font-semibold sm:text-6xl">SHAHADA</h1>

          <p className="max-w-md text-sm font-medium text-ink dark:text-white sm:text-xl">
            {subtitle}
          </p>

          <div className="mt-10 mb-4 md:mb-8 sm:mt-22">
            <VisualizerOrb mode={orbMode} volumeRef={volumeRef}  />

            {/* Show matched words in both speech and text mode */}
            {currentStep && transcript.trim() && !isComplete && (
              <MatchedWordsDisplay
                expected={currentStep.arabic}
                display={display}
              />
            )}
          </div>

          {/* Pronunciation guide — speech mode only */}
          {!showCertificate && isRecording && !isComplete && (
            <RecitePrompt
              step={currentStep!}
              stepIndex={steps}
              onSpeechStart={handlePromptSpeechStart}
              onSpeechEnd={handlePromptSpeechEnd}
            />
          )}

          <div className="mt-10 flex flex-col gap-4 items-center">
            {statusMessage && (
              <p className="text-sm text-red-500">{statusMessage}</p>
            )}

            {/* Entry point — shown before any session starts */}
            {!isRecording && !showCertificate && !textFlowStarted && (
              <IntroFlow onStart={handleStart} />
            )}

            {/* Stop button during active speech recording */}
            {hasSupport && isRecording && !showCertificate && (
              <Button variant="stop" onClick={handleStop}>
                Stop recording
              </Button>
            )}

            {/* Text input fallback for unsupported browsers */}
            {showTextFallback && (
              <TextInputFallback
                value={textInput}
                onChange={setTextInput}
                onSubmit={handleTextSubmit}
                isComplete={isComplete}
              />
            )}

            {/* Certificate — shown only after mic has fully closed */}
            {showCertificate && <Certificate onRestart={handleRestart} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;