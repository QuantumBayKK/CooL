@echo off
title FounderOS Launcher

echo ===============================
echo   Starting FounderOS Pipeline
echo ===============================

REM -------------------------------
REM 1. Start Ollama Server
REM -------------------------------
echo Starting Ollama server...
start "Ollama Server" cmd /k ollama serve

REM Give Ollama time to boot
timeout /t 6 > nul

REM -------------------------------
REM 2. Scrape public data
REM -------------------------------
echo Scraping public data...
start "Scraper" cmd /k ^
    .\.venv\Scripts\python.exe -m app.scraper

REM Wait to ensure scraping finishes
timeout /t 10 > nul

REM -------------------------------
REM 3. Build embeddings (BLOCKING)
REM -------------------------------
echo Building embeddings...
.\.venv\Scripts\python.exe -m app.ingest

REM Wait for embeddings to finish
timeout /t 6 > nul

REM -------------------------------
REM 4. Launch FounderOS (Multi-Agent)
REM -------------------------------
echo Launching FounderOS...
start "FounderOS" cmd /k ^
    .\.venv\Scripts\python.exe -m app.main

echo ===============================
echo   FounderOS is running
echo ===============================
