"use client";

// Uygulama açılış karşılama ekranı (Splash Screen)
export default function SplashScreen({ isDismissed, onDismiss }) {
  return (
    <div
      className={`splash-screen ${isDismissed ? 'dismissed' : ''}`}
      onClick={onDismiss}
    >
      <div className="splash-center">
        {/* İnce genişleyen halkalar */}
        <div className="splash-ring" />
        <div className="splash-ring splash-ring-2" />

        {/* Morfoz eden sıvı arka plan */}
        <div className="splash-blob" />

        {/* Ana logo ve başlık */}
        <h1
          className="splash-logo"
          style={{ animation: 'splashTitleReveal 4s ease-in-out infinite' }}
        >
          Dorkful.
        </h1>
      </div>

      {/* Ortadan genişleyen ince çizgi */}
      <div
        className="splash-line"
        style={{ animation: 'splashLineGrow 4s ease-in-out infinite 0.5s' }}
      />

      <p className="splash-subtitle">Advanced Dork Intelligence</p>
      <p className="splash-hint">click anywhere</p>
    </div>
  );
}
