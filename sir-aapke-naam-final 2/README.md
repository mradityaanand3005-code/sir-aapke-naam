# Sir, Aapke Naam! 🎂

A cinematic birthday experience for the CSE (AI) HOD, made by students.

## Run the website

1. Download and extract the complete `Sir-Aapke-Naam-Website.zip` file.
2. Open the extracted `sir-aapke-naam-final` folder in VS Code.
3. Open `index.html` with the VS Code **Live Server** extension. (Opening `index.html` directly in Chrome also works in most browsers.)
4. Click **ENTER THE SURPRISE**. This first interaction enables the website's audio.

**Important:** Keep the `assets` folder, `style.css`, and `script.js` beside `index.html`. Do not move or rename those files individually.

## Experience sequence

1. Grand Welcome: animated gold `Happy Birthday` and `Respected Sir!` typography, cinematic lighting, floating particles, glowing orbits, and the original HOD portrait.
2. Interactive 3D-style cake: layered cake, lit candles, blow interaction, smoke/glow and fireworks.
3. Memories: the two supplied real HOD photographs in animated frames.
4. HOD.exe: humorous fictional performance report.
5. Party proposal: approval or "Soch ke batata hoon" reactions.
6. Transfer rumour investigation: YES opens the emotional farewell; NO opens the fireworks celebration.
7. Final birthday appreciation, followed by a replay option.

## Music mapping

- Party **APPROVED**: the supplied birthday MP3 loops through the celebration, with the short meme clip as an approval sting.
- Party **SOCH KE BATATA HOON**: the supplied sad BGM plays during the funny disappointed reaction.
- When the transfer question appears, the party music stops.
- Transfer **YES**: the sad BGM plays behind the emotional farewell.
- Transfer **NO**: celebration music, the meme clip and fireworks play.

Use the top-right Sound control to mute or re-enable music.

## Included files

- `assets/hod-portrait.png` and `assets/hod-full-photo.png`: supplied real photographs.
- `assets/audio/birthday-funny.mp3`: supplied birthday audio.
- `assets/audio/sad-reaction.mp3`: supplied sad background music.
- `assets/audio/meme-sting.mp3`: supplied short meme clip.
- `style.css`: visual styling and animations.
- `script.js`: scene navigation, audio, cake, fireworks, memory gallery, decision branches and Easter eggs.

## Technical notes

- No framework, build step, backend, API key or internet-hosted image is required. Google Fonts are requested for the script and serif typography; system fallbacks are provided.
- Audio starts only after a visitor interaction, due to browser autoplay policies.
- The cake is assembled from CSS layers and lighting rather than a flat image.
- Scene switching uses one delegated event handler so dynamic YES/NO screens and replay remain functional.
- The website does not collect or send visitor information.
