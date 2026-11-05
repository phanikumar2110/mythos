#!/bin/bash
# CipherBase build script — renders episode JSON to MP4
# Usage: ./build.sh episodes/demo_episode.json [output_name]

set -e

SCENE=${1:-episodes/demo_episode.json}
NAME=${2:-$(basename "$SCENE" .json)}
OUT_DIR="episodes/$NAME"
OUT_MP4="$OUT_DIR/${NAME}.mp4"
WORK_DIR="$OUT_DIR/work"

mkdir -p "$WORK_DIR"
mkdir -p "$OUT_DIR"

echo "🎬 Building: $SCENE → $OUT_MP4"

# 1. Validate scene
echo "📋 Validating scene..."
node tools/validate_scene.js "$SCENE" || exit 1

# 2. Generate TTS narration
echo "🎙️  Generating narration (Kokoro)..."
node tools/tts.js "$SCENE" "$WORK_DIR/narration"

# 3. Generate sound effects
echo "🔊 Generating SFX..."
node tools/sfx.js "$SCENE" "$WORK_DIR/sfx"

# 4. Generate music (procedural)
echo "🎵 Generating score..."
node tools/music.js "$SCENE" "$WORK_DIR/music"

# 5. Mix audio
echo "🎚️  Mixing audio..."
node tools/mix.js "$WORK_DIR/narration" "$WORK_DIR/sfx" "$WORK_DIR/music" "$WORK_DIR/mix.wav" "$SCENE"

# 6. Render video frames (headless Canvas)
echo "🎞️  Rendering frames..."
node tools/render.js "$SCENE" "$WORK_DIR/frames"

# 7. Encode video
echo "📦 Encoding video..."
ffmpeg -y -framerate 24 -i "$WORK_DIR/frames/frame_%05d.png" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -vf "format=yuv420p" "$WORK_DIR/video_raw.mp4"

# 8. Mux audio + video
echo "🔗 Muxing..."
ffmpeg -y -i "$WORK_DIR/video_raw.mp4" -i "$WORK_DIR/mix.wav" \
  -c:v copy -c:a aac -b:a 192k -shortest "$OUT_MP4"

# 9. Generate subtitles
echo "📝 Generating subtitles..."
node tools/subtitles.js "$SCENE" "$OUT_DIR/${NAME}.srt"

echo "✅ Done: $OUT_MP4"
ls -lh "$OUT_MP4"