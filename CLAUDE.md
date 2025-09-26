# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `yarn dev` - Start development server with Vite
- `yarn build` - Build application (TypeScript compilation + Vite build)
- `yarn deploy` - Deploy to AWS CloudFront (builds first, then runs CDK deploy)
- CDK commands are run from `cdk-infra/` directory using `yarn cdk <command>`

## Architecture Overview

This is a React timer application built with TypeScript and Vite, designed for interval training workouts with integrated YouTube music playback.

### Core Components

**Timer Logic (`src/App.tsx`)**
- Main `Timer` component handles workout state machine with phases: pre-delay → work cycles → rest cycles → completion
- Uses precise millisecond timing with `Date.now()` for accuracy
- Configurable constants: `preDelay` (10s), `cycleWork` (20s), `cycleRest` (10s), `cycleCount` (8 cycles)
- Audio cues play automatically during phase transitions using Web Audio API

**Video Integration (`src/videoPlayer.tsx`)**
- YouTube player integration using `youtube-player` library
- Manages video loading, playback state synchronization with timer
- Dynamic volume control with lower volume during rest periods
- Handles YouTube API state changes and video cueing

**Music Playlist (`src/playlist.tsx`)**
- Hardcoded video list with YouTube IDs, start times, and titles
- Random shuffle on initialization using `useVideoList()` hook
- Playlist controls component for manual video selection

**React Utilities (`src/reactHelpers.ts`)**
- `useStableValue()` - Prevents unnecessary re-renders by maintaining object reference equality
- `useLocalState()` - localStorage-backed state with automatic persistence

### Audio System

Audio samples located in `/public/` directory:
- Pre-race announcements, countdown sequences, work/rest transitions
- All samples preloaded for responsive playback during timer phases

### AWS Deployment

CDK infrastructure (`cdk-infra/`) deploys to AWS:
- S3 bucket for static hosting with public read access
- CloudFront distribution for global CDN
- Automatic asset deployment and cache invalidation
- Configured for AWS account `941159756364` in `ca-central-1` region

### Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 + DaisyUI components
- **Build**: Vite with TypeScript compilation
- **Deployment**: AWS CDK with S3/CloudFront
- **Dependencies**: YouTube Player API, Luxon for time handling, clsx for conditional styling