#!/bin/bash
# Script to run Gource on the external La Gazette repository

echo "☄️ Launching Gource on '../La Gazette'..."
gource "../La Gazette" \
  --seconds-per-day 1.5 \
  --auto-skip-seconds 0.5 \
  --camera-mode track \
  --background-colour 0a0a0a \
  --font-size 16 \
  --title "La Gazette Ingestion Inquest" \
  --key
