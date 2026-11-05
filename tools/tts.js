/**
 * TTS generation using Kokoro (via local Python)
 * Generates narration WAV files and word-level timestamps
 */

import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export function generateTTS(scenePath, outputDir) {
  const scene = JSON.parse(readFileSync(scenePath, 'utf8'));
  const narration = scene.audio?.narration || [];
  
  if (narration.length === 0) {
    console.log('No narration lines found');
    return;
  }
  
  // Build lines.json for Kokoro
  const lines = narration.map(n => ({
    id: n.id,
    text: n.text,
    voice: getVoiceForCharacter(n.character),
    speed: n.speed || 0.95,
    lang: 'en-us'
  }));
  
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'lines.json'), JSON.stringify(lines, null, 2));
  
  // Run Kokoro TTS
  const pyPath = process.env.KOKORO_PY || '.venv/bin/python';
  const ttsScript = 'core/tts/tts.py';
  
  console.log('Running Kokoro TTS...');
  const result = spawnSync(pyPath, [ttsScript, join(outputDir, 'lines.json'), outputDir], {
    stdio: 'inherit',
    env: { ...process.env, PYTHONPATH: process.cwd() }
  });
  
  if (result.status !== 0) {
    throw new Error('Kokoro TTS failed');
  }
  
  // Run ASR check
  console.log('Running ASR verification...');
  const asrResult = spawnSync(pyPath, ['core/tts/asr_check.py', join(outputDir, 'lines.json'), outputDir, '--lang', 'en'], {
    stdio: 'inherit',
    env: { ...process.env, PYTHONPATH: process.cwd() }
  });
  
  if (asrResult.status !== 0) {
    console.warn('ASR check had mismatches - review output');
  }
  
  console.log(`TTS complete: ${outputDir}`);
}

function getVoiceForCharacter(character) {
  const voices = {
    'cipher': 'af_heart',
    'echo': 'bm_george',
    'voxel': 'af_bella',
    'silhouette': 'am_michael',
    'narrator': 'af_kore'
  };
  return voices[character] || 'af_heart';
}

export default { generateTTS };