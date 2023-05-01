#!/bin/bash
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make
mv ./main ../util/whisper
cd ..
rm -r whisper.cpp
chmod +x ./util/whisper